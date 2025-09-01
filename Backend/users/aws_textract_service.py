import json
import logging
import time
from typing import Dict, Any, Optional, Tuple
from io import BytesIO

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from django.conf import settings
from PIL import Image

logger = logging.getLogger(__name__)

class AWSTextractService:
    """AWS Textract service for Ghana Card ID document processing"""
    
    def __init__(self):
        """Initialize AWS Textract and S3 clients"""
        try:
            # Initialize AWS clients
            self.textract_client = boto3.client(
                'textract',
                aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
                aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
                region_name=getattr(settings, 'AWS_REGION', 'us-east-1')
            )
            
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
                aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
                region_name=getattr(settings, 'AWS_REGION', 'us-east-1')
            )
            
            self.s3_bucket = getattr(settings, 'AWS_S3_BUCKET_NAME', None)
            
            if not self.s3_bucket:
                raise ValueError("AWS_S3_BUCKET_NAME not configured")
                
        except Exception as e:
            logger.error(f"Failed to initialize AWS clients: {str(e)}")
            raise
    
    def validate_aws_credentials(self) -> bool:
        """Validate AWS credentials and permissions"""
        try:
            # Test S3 access
            self.s3_client.head_bucket(Bucket=self.s3_bucket)
            
            # Test Textract access by checking supported document types
            self.textract_client.list_tags_for_resource(ResourceARN="test")
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchBucket':
                logger.error(f"S3 bucket {self.s3_bucket} does not exist")
                return False
            elif error_code in ['AccessDenied', 'Forbidden']:
                logger.error("AWS credentials do not have required permissions")
                return False
            # For Textract test, InvalidParameterException is expected
            return True
        except NoCredentialsError:
            logger.error("AWS credentials not found")
            return False
        except Exception as e:
            logger.error(f"AWS validation failed: {str(e)}")
            return False
        
        return True
    
    def upload_to_s3(self, image_file, file_key: str) -> str:
        """Upload image file to S3 and return the key"""
        try:
            # Reset file pointer
            image_file.seek(0)
            
            # Validate and optimize image
            optimized_image = self._optimize_image_for_textract(image_file)
            
            # Upload to S3
            self.s3_client.upload_fileobj(
                optimized_image,
                self.s3_bucket,
                file_key,
                ExtraArgs={
                    'ContentType': 'image/jpeg',
                    'ServerSideEncryption': 'AES256'
                }
            )
            
            logger.info(f"Successfully uploaded image to S3: {file_key}")
            return file_key
            
        except Exception as e:
            logger.error(f"Failed to upload image to S3: {str(e)}")
            raise
    
    def _optimize_image_for_textract(self, image_file) -> BytesIO:
        """Optimize image for Textract processing"""
        try:
            # Reset file pointer
            image_file.seek(0)
            
            # Open image with PIL
            image = Image.open(image_file)
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Get image dimensions
            width, height = image.size
            
            # Textract requirements: max 10MB, max 4096x4096 pixels
            max_dimension = 4096
            max_file_size = 10 * 1024 * 1024  # 10MB
            
            # Resize if too large
            if width > max_dimension or height > max_dimension:
                ratio = min(max_dimension / width, max_dimension / height)
                new_width = int(width * ratio)
                new_height = int(height * ratio)
                image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
                logger.info(f"Resized image from {width}x{height} to {new_width}x{new_height}")
            
            # Save optimized image to BytesIO
            optimized_buffer = BytesIO()
            
            # Try different quality settings to meet size requirement
            for quality in [95, 85, 75, 65]:
                optimized_buffer.seek(0)
                optimized_buffer.truncate()
                
                image.save(optimized_buffer, format='JPEG', quality=quality, optimize=True)
                
                if optimized_buffer.tell() <= max_file_size:
                    break
                    
                if quality == 65:
                    logger.warning(f"Image still too large after optimization: {optimized_buffer.tell()} bytes")
            
            optimized_buffer.seek(0)
            return optimized_buffer
            
        except Exception as e:
            logger.error(f"Failed to optimize image: {str(e)}")
            raise
    
    def analyze_ghana_card(self, front_image_file, back_image_file, user_id: str) -> Dict[str, Any]:
        """
        Analyze Ghana Card images using AWS Textract AnalyzeID
        
        Args:
            front_image_file: Front image of Ghana Card
            back_image_file: Back image of Ghana Card
            user_id: User identifier for file naming
            
        Returns:
            Dict containing extracted information
        """
        start_time = time.time()
        
        try:
            # Validate AWS setup
            if not self.validate_aws_credentials():
                raise Exception("AWS credentials validation failed")
            
            # Generate unique file keys
            timestamp = str(int(time.time()))
            front_key = f"ghana-cards/{user_id}/front_{timestamp}.jpg"
            back_key = f"ghana-cards/{user_id}/back_{timestamp}.jpg"
            
            # Upload images to S3
            logger.info("Uploading images to S3...")
            front_s3_key = self.upload_to_s3(front_image_file, front_key)
            back_s3_key = self.upload_to_s3(back_image_file, back_key)
            
            # Analyze front image (contains name and photo)
            logger.info("Analyzing front image with Textract...")
            front_analysis = self._analyze_single_image(front_s3_key, document_type="IDENTITY_DOCUMENT")
            
            # Analyze back image (contains ID number)
            logger.info("Analyzing back image with Textract...")
            back_analysis = self._analyze_single_image(back_s3_key, document_type="IDENTITY_DOCUMENT")
            
            # Extract structured information
            extracted_info = self._extract_ghana_card_info(front_analysis, back_analysis)
            
            # Clean up S3 files (optional - you might want to keep them for audit)
            self._cleanup_s3_files([front_s3_key, back_s3_key])
            
            processing_time = (time.time() - start_time) * 1000
            
            result = {
                'success': True,
                'processing_time_ms': round(processing_time, 2),
                'extracted_data': extracted_info,
                'textract_analysis': {
                    'front_confidence': self._get_average_confidence(front_analysis),
                    'back_confidence': self._get_average_confidence(back_analysis)
                }
            }
            
            logger.info(f"Ghana Card analysis completed successfully in {processing_time:.2f}ms")
            return result
            
        except Exception as e:
            processing_time = (time.time() - start_time) * 1000
            logger.error(f"Ghana Card analysis failed after {processing_time:.2f}ms: {str(e)}")
            
            return {
                'success': False,
                'error': str(e),
                'processing_time_ms': round(processing_time, 2),
                'extracted_data': {
                    'surname': None,
                    'firstname': None,
                    'ghana_card_number': None
                }
            }
    
    def _analyze_single_image(self, s3_key: str, document_type: str = "IDENTITY_DOCUMENT") -> Dict[str, Any]:
        """Analyze a single image using Textract AnalyzeID"""
        try:
            response = self.textract_client.analyze_id(
                DocumentPages=[
                    {
                        'S3Object': {
                            'Bucket': self.s3_bucket,
                            'Name': s3_key
                        }
                    }
                ]
            )
            
            return response
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"Textract AnalyzeID failed for {s3_key}: {error_code} - {error_message}")
            raise Exception(f"Textract analysis failed: {error_message}")
        except Exception as e:
            logger.error(f"Unexpected error during Textract analysis: {str(e)}")
            raise
    
    def _extract_ghana_card_info(self, front_analysis: Dict[str, Any], back_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Extract structured information from Textract analysis results"""
        
        extracted_info = {
            'surname': None,
            'firstname': None,
            'ghana_card_number': None,
            'confidence_scores': {
                'surname': 0.0,
                'firstname': 0.0,
                'ghana_card_number': 0.0
            }
        }
        
        try:
            # Extract from front image (name information)
            front_fields = self._extract_identity_fields(front_analysis)
            
            # Extract from back image (ID number)
            back_fields = self._extract_identity_fields(back_analysis)
            
            # Combine all fields
            all_fields = {**front_fields, **back_fields}
            
            # Enhanced field mapping for Ghana Card
            field_mapping = {
                'FIRST_NAME': 'firstname',
                'LAST_NAME': 'surname', 
                'MIDDLE_NAME': 'firstname',  # Append to firstname
                'DOCUMENT_NUMBER': 'ghana_card_number',
                'ID_NUMBER': 'ghana_card_number',
                'CARD_NUMBER': 'ghana_card_number',
                'NATIONAL_ID': 'ghana_card_number'
            }
            
            # Process extracted fields
            for textract_field, our_field in field_mapping.items():
                if textract_field in all_fields:
                    field_data = all_fields[textract_field]
                    value = field_data['value']
                    confidence = field_data['confidence']
                    
                    if our_field == 'firstname' and extracted_info['firstname']:
                        # Append middle name to first name
                        extracted_info['firstname'] += f" {value}"
                        # Use average confidence
                        current_conf = extracted_info['confidence_scores']['firstname']
                        extracted_info['confidence_scores']['firstname'] = (current_conf + confidence) / 2
                    else:
                        extracted_info[our_field] = value
                        extracted_info['confidence_scores'][our_field] = confidence
            
            # If Ghana card number not found via structured fields, try pattern matching on all text
            if not extracted_info['ghana_card_number']:
                logger.info("Ghana card number not found in structured fields, trying pattern matching...")
                extracted_info['ghana_card_number'], extracted_info['confidence_scores']['ghana_card_number'] = \
                    self._extract_ghana_number_from_text(back_analysis)
            
            # Post-process Ghana Card number format
            if extracted_info['ghana_card_number']:
                extracted_info['ghana_card_number'] = self._format_ghana_card_number(
                    extracted_info['ghana_card_number']
                )
            
            # Clean up names
            if extracted_info['surname']:
                extracted_info['surname'] = extracted_info['surname'].title().strip()
            if extracted_info['firstname']:
                extracted_info['firstname'] = extracted_info['firstname'].title().strip()
            
            return extracted_info
            
        except Exception as e:
            logger.error(f"Error extracting Ghana Card info: {str(e)}")
            return extracted_info
    
    def _extract_identity_fields(self, analysis_result: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """Extract identity fields from Textract analysis result"""
        fields = {}
        
        try:
            if 'IdentityDocuments' in analysis_result:
                for document in analysis_result['IdentityDocuments']:
                    if 'IdentityDocumentFields' in document:
                        for field in document['IdentityDocumentFields']:
                            field_type = field.get('Type', {}).get('Text', '')
                            field_value = field.get('ValueDetection', {}).get('Text', '')
                            field_confidence = field.get('ValueDetection', {}).get('Confidence', 0.0)
                            
                            if field_type and field_value:
                                fields[field_type] = {
                                    'value': field_value,
                                    'confidence': field_confidence
                                }
            
            return fields
            
        except Exception as e:
            logger.error(f"Error extracting identity fields: {str(e)}")
            return fields
    
    def _extract_ghana_number_from_text(self, analysis_result: Dict[str, Any]) -> tuple[str, float]:
        """
        Extract Ghana card number from all detected text using pattern matching
        Returns: (ghana_card_number, confidence)
        """
        try:
            all_text_blocks = []
            
            # Extract all text from Textract response
            if 'IdentityDocuments' in analysis_result:
                for document in analysis_result['IdentityDocuments']:
                    # Get text from identity document fields
                    if 'IdentityDocumentFields' in document:
                        for field in document['IdentityDocumentFields']:
                            if 'ValueDetection' in field and field['ValueDetection'].get('Text'):
                                text = field['ValueDetection']['Text']
                                confidence = field['ValueDetection'].get('Confidence', 0.0)
                                all_text_blocks.append((text, confidence))
                    
                    # Also check if there are any text blocks in the document
                    if 'Blocks' in document:
                        for block in document['Blocks']:
                            if block.get('BlockType') == 'LINE' and block.get('Text'):
                                text = block['Text']
                                confidence = block.get('Confidence', 0.0)
                                all_text_blocks.append((text, confidence))
            
            # Also check top-level Blocks if available
            if 'Blocks' in analysis_result:
                for block in analysis_result['Blocks']:
                    if block.get('BlockType') == 'LINE' and block.get('Text'):
                        text = block['Text']
                        confidence = block.get('Confidence', 0.0)
                        all_text_blocks.append((text, confidence))
            
            # Pattern matching for Ghana card number format: GHA-XXXXXXXXX-X
            import re
            ghana_patterns = [
                # Full format: GHA-725499847-1
                r'GHA[-\s]*(\d{9})[-\s]*(\d{1})',
                # Spaces or other separators: GHA 725499847 1
                r'GHA[^\d]*(\d{9})[^\d]*(\d{1})',
                # Without separators: GHA7254998471
                r'GHA(\d{9})(\d{1})',
                # Just the number part if GHA is separate: 725499847-1
                r'^(\d{9})[-\s]*(\d{1})$'
            ]
            
            best_match = None
            best_confidence = 0.0
            
            for text, confidence in all_text_blocks:
                text_clean = text.strip().upper()
                logger.debug(f"Checking text block: '{text_clean}' (confidence: {confidence})")
                
                for pattern in ghana_patterns:
                    match = re.search(pattern, text_clean)
                    if match:
                        if len(match.groups()) == 2:
                            # Format: GHA-XXXXXXXXX-X
                            ghana_number = f"GHA-{match.group(1)}-{match.group(2)}"
                        else:
                            # Fallback
                            ghana_number = text_clean
                        
                        if confidence > best_confidence:
                            best_match = ghana_number
                            best_confidence = confidence
                            logger.info(f"Found Ghana card number pattern: {ghana_number} (confidence: {confidence})")
            
            return best_match, best_confidence
            
        except Exception as e:
            logger.error(f"Error in pattern matching for Ghana card number: {str(e)}")
            return None, 0.0
    
    def _format_ghana_card_number(self, card_number: str) -> str:
        """Format Ghana Card number to standard format GHA-XXXXXXXXX-X (9 digits + 1 check digit)"""
        try:
            # Remove all non-alphanumeric characters
            clean_number = ''.join(c for c in card_number if c.isalnum())
            
            # Check if it starts with GHA
            if clean_number.upper().startswith('GHA'):
                digits = clean_number[3:]  # Remove GHA prefix
            else:
                digits = clean_number
            
            # Format as GHA-XXXXXXXXX-X if we have exactly 10 digits (9 + 1 check digit)
            if len(digits) == 10 and digits.isdigit():
                return f"GHA-{digits[:9]}-{digits[9]}"
            elif len(digits) >= 10:
                # Take first 10 digits if more than 10
                return f"GHA-{digits[:9]}-{digits[9]}"
            else:
                # Return with GHA prefix if not enough digits
                return f"GHA-{digits}"
                
        except Exception as e:
            logger.error(f"Error formatting Ghana Card number: {str(e)}")
            return card_number
    
    def _get_average_confidence(self, analysis_result: Dict[str, Any]) -> float:
        """Calculate average confidence from Textract analysis result"""
        try:
            confidences = []
            
            if 'IdentityDocuments' in analysis_result:
                for document in analysis_result['IdentityDocuments']:
                    if 'IdentityDocumentFields' in document:
                        for field in document['IdentityDocumentFields']:
                            confidence = field.get('ValueDetection', {}).get('Confidence', 0.0)
                            if confidence > 0:
                                confidences.append(confidence)
            
            return sum(confidences) / len(confidences) if confidences else 0.0
            
        except Exception as e:
            logger.error(f"Error calculating average confidence: {str(e)}")
            return 0.0
    
    def _cleanup_s3_files(self, s3_keys: list):
        """Clean up uploaded S3 files (optional)"""
        try:
            for key in s3_keys:
                self.s3_client.delete_object(Bucket=self.s3_bucket, Key=key)
            logger.info(f"Cleaned up {len(s3_keys)} S3 files")
        except Exception as e:
            logger.warning(f"Failed to clean up S3 files: {str(e)}")

# Global instance
aws_textract_service = AWSTextractService()