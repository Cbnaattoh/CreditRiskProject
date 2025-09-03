import logging
import time
from typing import Dict, Any, Optional
from django.conf import settings

logger = logging.getLogger(__name__)

class GhanaCardTextractService:
    """
    Ghana Card service that uses AWS Textract exclusively
    """
    
    def __init__(self):
        # Always use AWS Textract - no fallbacks
        try:
            from .aws_textract_service import aws_textract_service
            self.textract_service = aws_textract_service
            logger.info("AWS Textract service initialized")
        except Exception as e:
            logger.error(f"Failed to initialize AWS Textract service: {str(e)}")
            raise Exception("AWS Textract service is required but failed to initialize")
    
    def process_ghana_card_enterprise(self, front_image_file, back_image_file,
                                    first_name: str, last_name: str, 
                                    ghana_card_number: str) -> Dict[str, Any]:
        """
        Process Ghana Card using AWS Textract exclusively
        
        Returns:
            Dict with standardized structure for Ghana Card processing
        """
        start_time = time.time()
        
        try:
            logger.info("Processing Ghana Card with AWS Textract...")
            
            # Generate user ID for S3 file naming (use email hash or similar)
            import hashlib
            user_id = hashlib.md5(f"{first_name}_{last_name}_{time.time()}".encode()).hexdigest()[:8]
            
            # Process with Textract
            textract_result = self.textract_service.analyze_ghana_card(
                front_image_file, back_image_file, user_id
            )
            
            if textract_result['success']:
                # Convert Textract result to standardized format
                converted_result = self._convert_textract_to_standard_format(
                    textract_result, first_name, last_name, ghana_card_number
                )
                
                processing_time = (time.time() - start_time) * 1000
                converted_result['processing_time_ms'] = processing_time
                converted_result['processing_engine'] = 'textract'
                
                logger.info(f"AWS Textract processing completed successfully in {processing_time:.2f}ms")
                return converted_result
            else:
                # AWS Textract failed - return error result
                processing_time = (time.time() - start_time) * 1000
                error_message = textract_result.get('error', 'Unknown AWS Textract error')
                logger.error(f"AWS Textract processing failed: {error_message}")
                
                return {
                    'success': False,
                    'verification_status': 'error',
                    'processing_engine': 'textract_failed',
                    'processing_time_ms': processing_time,
                    'results': {
                        'extracted_name': None,
                        'extracted_number': None,
                        'name_verified': False,
                        'number_verified': False,
                        'confidence': 0,
                        'similarity_score': 0.0,
                        'message': f'AWS Textract processing failed: {error_message}',
                        'detailed_analysis': {
                            'name_components': [],
                            'card_number_segments': [],
                            'ocr_quality_score': 0,
                            'image_quality_assessment': {
                                'front_image': {'clarity': 0, 'brightness': 0, 'contrast': 0},
                                'back_image': {'clarity': 0, 'brightness': 0, 'contrast': 0}
                            }
                        }
                    },
                    'errors': [f'AWS Textract processing failed: {error_message}'],
                    'recommendations': [
                        'Ensure images are clear and well-lit with good contrast',
                        'Make sure the Ghana Card is flat and not bent or curved',
                        'Take photos in good lighting conditions (avoid shadows and glare)',
                        'Ensure all text on the card is clearly visible and not blurry',
                        'For Ghana card numbers: Check back of card for clearest number',
                        'For complex names: Ensure front image shows complete name clearly',
                        'Use high resolution images (minimum 1080p recommended)',
                        'Check AWS Textract service configuration and credentials'
                    ]
                }
                
        except Exception as e:
            processing_time = (time.time() - start_time) * 1000
            logger.error(f"Ghana Card processing failed with exception: {str(e)}")
            
            return {
                'success': False,
                'verification_status': 'error',
                'processing_engine': 'failed',
                'processing_time_ms': processing_time,
                'results': {
                    'extracted_name': None,
                    'extracted_number': None,
                    'name_verified': False,
                    'number_verified': False,
                    'confidence': 0,
                    'similarity_score': 0.0,
                    'message': f'Ghana Card processing failed: {str(e)}',
                    'detailed_analysis': {
                        'name_components': [],
                        'card_number_segments': [],
                        'ocr_quality_score': 0,
                        'image_quality_assessment': {
                            'front_image': {'clarity': 0, 'brightness': 0, 'contrast': 0},
                            'back_image': {'clarity': 0, 'brightness': 0, 'contrast': 0}
                        }
                    }
                },
                'errors': [f'Processing exception: {str(e)}'],
                'recommendations': [
                    'Ensure images are clear and well-lit with good contrast',
                    'Make sure the Ghana Card is flat and not bent or curved', 
                    'Take photos in good lighting conditions (avoid shadows and glare)',
                    'For Ghana card numbers: Check back of card for clearest number',
                    'For complex names: Ensure front image shows complete name clearly',
                    'Use high resolution images (minimum 1080p recommended)',
                    'Check AWS Textract service configuration',
                    'Verify AWS credentials and permissions'
                ]
            }
    
    def _convert_textract_to_standard_format(self, textract_result: Dict[str, Any], 
                                      first_name: str, last_name: str, 
                                      ghana_card_number: str) -> Dict[str, Any]:
        """
        Convert AWS Textract result to standardized Ghana Card processing format
        """
        extracted_data = textract_result['extracted_data']
        textract_analysis = textract_result.get('textract_analysis', {})
        
        # Extract Textract data
        extracted_name = None
        if extracted_data.get('firstname') and extracted_data.get('surname'):
            extracted_name = f"{extracted_data['firstname']} {extracted_data['surname']}"
        elif extracted_data.get('firstname'):
            extracted_name = extracted_data['firstname']
        elif extracted_data.get('surname'):
            extracted_name = extracted_data['surname']
            
        extracted_number = extracted_data.get('ghana_card_number')
        
        # Verify name match
        name_verified = False
        similarity_score = 0.0
        if extracted_name:
            name_verified, similarity_score = self._verify_name_match(
                first_name, last_name, extracted_name
            )
        
        # Verify card number match
        number_verified = False
        if extracted_number and ghana_card_number:
            number_verified = self._verify_card_number_match(
                ghana_card_number, extracted_number
            )
        
        # Calculate overall confidence
        confidence_scores = extracted_data.get('confidence_scores', {})
        overall_confidence = (
            confidence_scores.get('firstname', 0) + 
            confidence_scores.get('surname', 0) + 
            confidence_scores.get('ghana_card_number', 0)
        ) / 3
        
        # Determine verification status
        if name_verified and number_verified:
            verification_status = 'success'
            message = 'Ghana Card verification successful using AWS Textract'
        elif name_verified or number_verified:
            verification_status = 'warning'
            verified_fields = []
            if name_verified:
                verified_fields.append('Name')
            if number_verified:
                verified_fields.append('Number')
            message = f"Partial verification using AWS Textract: {', '.join(verified_fields)} verified"
        else:
            verification_status = 'error'
            message = 'Verification failed using AWS Textract'
        
        # Convert to standard processing format
        result = {
            'success': True,
            'verification_status': verification_status,
            'processing_engine': 'textract',
            'results': {
                'extracted_name': extracted_name,
                'extracted_number': extracted_number,
                'name_verified': name_verified,
                'number_verified': number_verified,
                'confidence': round(overall_confidence, 2),
                'similarity_score': similarity_score,
                'message': message,
                'detailed_analysis': {
                    'name_components': extracted_name.split() if extracted_name else [],
                    'card_number_segments': extracted_number.split('-') if extracted_number else [],
                    'ocr_quality_score': (
                        textract_analysis.get('front_confidence', 0) + 
                        textract_analysis.get('back_confidence', 0)
                    ) / 2,
                    'image_quality_assessment': {
                        'front_image': {
                            'clarity': textract_analysis.get('front_confidence', 0),
                            'brightness': 100,  # Textract handles optimization
                            'contrast': 100
                        },
                        'back_image': {
                            'clarity': textract_analysis.get('back_confidence', 0),
                            'brightness': 100,
                            'contrast': 100
                        }
                    },
                    'textract_confidence_scores': confidence_scores
                }
            },
            'errors': [],
            'recommendations': [
                'AWS Textract processing completed successfully',
                'High-quality document analysis performed'
            ]
        }
        
        return result
    
    def _verify_name_match(self, first_name: str, last_name: str, extracted_name: str) -> tuple[bool, float]:
        """Verify if names match with similarity calculation"""
        if not extracted_name:
            return False, 0.0
        
        import difflib
        
        profile_name = f"{first_name} {last_name}".strip().lower()
        extracted_name_lower = extracted_name.strip().lower()
        
        # Calculate similarity
        similarity = difflib.SequenceMatcher(None, profile_name, extracted_name_lower).ratio()
        
        # Also check word-based similarity
        words1 = set(profile_name.split())
        words2 = set(extracted_name_lower.split())
        
        if words1 and words2:
            word_similarity = len(words1.intersection(words2)) / len(words1.union(words2))
            similarity = max(similarity, word_similarity)
        
        threshold = 0.6  # 60% similarity threshold for Textract (higher confidence)
        matches = similarity >= threshold
        
        return matches, similarity
    
    def _verify_card_number_match(self, input_number: str, extracted_number: str) -> bool:
        """Verify if card numbers match"""
        if not input_number or not extracted_number:
            return False
        
        # Normalize both numbers
        input_normalized = input_number.upper().replace('-', '').replace(' ', '')
        extracted_normalized = extracted_number.upper().replace('-', '').replace(' ', '')
        
        return input_normalized == extracted_normalized

# Global instance
ghana_card_textract_service = GhanaCardTextractService()