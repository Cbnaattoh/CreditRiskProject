import re
import logging
from typing import Dict, Optional, Tuple
from PIL import Image
import pytesseract
import cv2
import numpy as np
from io import BytesIO
import difflib

logger = logging.getLogger(__name__)

class GhanaCardService:
    """Service for processing Ghana Card images and extracting information using OCR"""
    
    @staticmethod
    def preprocess_image(image_file, enhance_for_text=True) -> np.ndarray:
        """
        Preprocess the image for better OCR results with multiple enhancement techniques
        """
        try:
            # Read image file
            image_bytes = image_file.read()
            image_file.seek(0)  # Reset file pointer
            
            # Convert to PIL Image
            pil_image = Image.open(BytesIO(image_bytes))
            
            # Convert to RGB if necessary
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            
            # Convert to numpy array
            img_array = np.array(pil_image)
            
            # Convert RGB to BGR for OpenCV
            img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            # Resize image if too small (upscale for better OCR)
            height, width = img_bgr.shape[:2]
            if width < 800 or height < 600:
                scale_factor = max(800/width, 600/height)
                new_width = int(width * scale_factor)
                new_height = int(height * scale_factor)
                img_bgr = cv2.resize(img_bgr, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
            
            # Convert to grayscale
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            
            # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            enhanced = clahe.apply(gray)
            
            # Apply bilateral filter to reduce noise while preserving edges
            filtered = cv2.bilateralFilter(enhanced, 9, 75, 75)
            
            # Apply denoising
            denoised = cv2.fastNlMeansDenoising(filtered)
            
            if enhance_for_text:
                # Apply adaptive thresholding for text enhancement
                thresh = cv2.adaptiveThreshold(
                    denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 10
                )
                
                # Apply morphological operations to clean up text
                kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
                processed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
                
                # Remove small noise
                kernel_noise = np.ones((1, 1), np.uint8)
                processed = cv2.morphologyEx(processed, cv2.MORPH_OPEN, kernel_noise)
            else:
                processed = denoised
            
            return processed
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {str(e)}")
            raise
    
    @staticmethod
    def extract_text_from_image(image_file, for_names=True) -> str:
        """
        Extract all text from the Ghana Card image using Tesseract OCR with multiple approaches
        """
        try:
            # Check if Tesseract is available
            try:
                import subprocess
                subprocess.run(['tesseract', '--version'], capture_output=True, check=True)
            except (subprocess.CalledProcessError, FileNotFoundError):
                logger.error("Tesseract OCR engine not found. Please install Tesseract OCR.")
                raise Exception("Tesseract OCR engine is not installed. Please install Tesseract OCR to enable Ghana Card verification.")
            
            best_text = ""
            best_score = 0
            
            # Try multiple OCR configurations and preprocessing approaches
            configs = [
                # For names - allow letters and spaces only
                r'--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ',
                # For mixed content - more permissive
                r'--oem 3 --psm 6',
                # For structured text
                r'--oem 3 --psm 4',
                # For single text block
                r'--oem 3 --psm 8',
                # Try with different page segmentation modes
                r'--oem 3 --psm 7',
                r'--oem 3 --psm 13',
            ] if for_names else [
                # For card numbers - focus on digits and letters
                r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-',
                r'--oem 3 --psm 7 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-',
                r'--oem 3 --psm 8 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-',
                r'--oem 3 --psm 6',
                r'--oem 3 --psm 13',
            ]
            
            for config in configs:
                try:
                    # Try with enhanced preprocessing
                    processed_image = GhanaCardService.preprocess_image(image_file, enhance_for_text=True)
                    
                    # Extract text using current config
                    extracted_text = pytesseract.image_to_string(processed_image, config=config)
                    cleaned_text = extracted_text.strip()
                    
                    # Score this result based on content quality
                    score = GhanaCardService._score_ocr_result(cleaned_text, for_names)
                    
                    if score > best_score:
                        best_text = cleaned_text
                        best_score = score
                    
                    # Also try with minimal preprocessing for comparison
                    processed_image_minimal = GhanaCardService.preprocess_image(image_file, enhance_for_text=False)
                    extracted_text_minimal = pytesseract.image_to_string(processed_image_minimal, config=config)
                    cleaned_text_minimal = extracted_text_minimal.strip()
                    
                    score_minimal = GhanaCardService._score_ocr_result(cleaned_text_minimal, for_names)
                    
                    if score_minimal > best_score:
                        best_text = cleaned_text_minimal
                        best_score = score_minimal
                        
                except Exception as e:
                    logger.warning(f"OCR config failed: {config}, error: {str(e)}")
                    continue
            
            return best_text
            
        except Exception as e:
            logger.error(f"Error extracting text from image: {str(e)}")
            return ""
    
    @staticmethod
    def _score_ocr_result(text: str, for_names: bool) -> float:
        """Score OCR result quality"""
        if not text:
            return 0.0
        
        score = 0.0
        
        if for_names:
            # Score based on likely name content
            letters = len(re.findall(r'[A-Za-z]', text))
            total_chars = len(text.replace(' ', '').replace('\n', ''))
            
            if total_chars > 0:
                letter_ratio = letters / total_chars
                score += letter_ratio * 50  # Bonus for high letter content
            
            # Bonus for reasonable length
            if 5 <= len(text.replace(' ', '')) <= 50:
                score += 20
            
            # Bonus for having spaces (multiple words)
            if ' ' in text.strip():
                score += 15
            
            # Penalty for too many special characters
            special_chars = len(re.findall(r'[^A-Za-z\s-]', text))
            score -= special_chars * 2
            
        else:
            # Score based on likely card number content  
            digits = len(re.findall(r'\d', text))
            gha_count = text.upper().count('GHA')
            
            score += digits * 3  # Bonus for digits
            score += gha_count * 20  # Bonus for GHA prefix
            
            # Bonus for proper card number pattern
            if re.search(r'GHA[^\w]*\d', text, re.IGNORECASE):
                score += 30
        
        return score
    
    @staticmethod
    def extract_name_from_text(extracted_text: str) -> Optional[str]:
        """
        Parse extracted text to find the name field from Ghana Card
        Ghana Cards typically have the name field after certain keywords
        """
        if not extracted_text:
            return None
        
        try:
            lines = extracted_text.split('\n')
            
            # Common patterns for name extraction from Ghana Card
            name_indicators = [
                'NAME', 'FULL NAME', 'SURNAME', 'FIRST NAME', 'LAST NAME',
                'HOLDER', 'CARDHOLDER', 'BEARER'
            ]
            
            found_name = None
            
            # Look for name indicators in the text
            for i, line in enumerate(lines):
                line = line.strip().upper()
                
                # Check if this line contains a name indicator
                for indicator in name_indicators:
                    if indicator in line:
                        # Check if name is on the same line after the indicator
                        if ':' in line:
                            parts = line.split(':', 1)
                            if len(parts) > 1 and parts[1].strip():
                                potential_name = parts[1].strip()
                                if GhanaCardService.is_valid_name(potential_name):
                                    found_name = potential_name
                                    break
                        
                        # Check if name is on the next line
                        elif i + 1 < len(lines):
                            next_line = lines[i + 1].strip()
                            if next_line and GhanaCardService.is_valid_name(next_line):
                                found_name = next_line
                                break
                
                if found_name:
                    break
            
            # If no name found with indicators, try to find the longest valid name-like string
            if not found_name:
                for line in lines:
                    cleaned_line = line.strip()
                    if (len(cleaned_line) > 5 and 
                        GhanaCardService.is_valid_name(cleaned_line) and
                        len(cleaned_line.split()) >= 2):  # At least two words
                        found_name = cleaned_line
                        break
            
            return found_name.title() if found_name else None
            
        except Exception as e:
            logger.error(f"Error parsing name from text: {str(e)}")
            return None
    
    @staticmethod
    def is_valid_name(text: str) -> bool:
        """
        Check if extracted text looks like a valid name
        """
        if not text or len(text) < 2:
            return False
        
        # Remove common non-name elements
        invalid_patterns = [
            r'^\d+$',  # Only numbers
            r'^[^A-Za-z]+$',  # No letters
            r'GHANA|CARD|REPUBLIC|GOVERNMENT',  # Common card text
            r'ID|IDENTIFICATION|NUMBER',
            r'DATE|BIRTH|ISSUE|EXPIRE',
            r'SEX|MALE|FEMALE',
            r'GHA-\d+-\d',  # Card number pattern
        ]
        
        text_upper = text.upper()
        for pattern in invalid_patterns:
            if re.search(pattern, text_upper):
                return False
        
        # Check if it contains at least some letters
        if not re.search(r'[A-Za-z]', text):
            return False
        
        # Check if it's not too long (names shouldn't be extremely long)
        if len(text) > 100:
            return False
        
        return True
    
    @staticmethod
    def extract_name_from_image(image_file) -> Optional[str]:
        """
        Main method to extract name from Ghana Card image
        """
        try:
            # Extract all text from image using name-optimized settings
            extracted_text = GhanaCardService.extract_text_from_image(image_file, for_names=True)
            
            if not extracted_text:
                logger.warning("No text extracted from Ghana Card image")
                return None
            
            logger.info(f"Extracted text from Ghana Card: {extracted_text[:200]}...")
            
            # Parse text to find name
            extracted_name = GhanaCardService.extract_name_from_text(extracted_text)
            
            if extracted_name:
                logger.info(f"Successfully extracted name: {extracted_name}")
            else:
                logger.warning("Could not identify name in extracted text")
            
            return extracted_name
            
        except Exception as e:
            logger.error(f"Error extracting name from Ghana Card: {str(e)}")
            return None
    
    @staticmethod
    def normalize_name(name: str) -> str:
        """Normalize a name for comparison"""
        if not name:
            return ""
        
        # Remove extra spaces, convert to lowercase
        normalized = re.sub(r'\s+', ' ', name.strip().lower())
        
        # Remove common prefixes/suffixes
        prefixes = ['mr', 'mrs', 'miss', 'ms', 'dr', 'prof']
        suffixes = ['jr', 'sr', 'ii', 'iii']
        
        words = normalized.split()
        
        # Remove prefixes
        if words and words[0] in prefixes:
            words = words[1:]
        
        # Remove suffixes
        if words and words[-1] in suffixes:
            words = words[:-1]
        
        return ' '.join(words)
    
    @staticmethod
    def calculate_name_similarity(name1: str, name2: str) -> float:
        """Calculate similarity between two names with fuzzy matching for OCR errors"""
        norm_name1 = GhanaCardService.normalize_name(name1)
        norm_name2 = GhanaCardService.normalize_name(name2)
        
        if not norm_name1 or not norm_name2:
            return 0.0
        
        # Multiple similarity approaches for robustness
        similarities = []
        
        # 1. Direct sequence similarity
        seq_similarity = difflib.SequenceMatcher(None, norm_name1, norm_name2).ratio()
        similarities.append(seq_similarity)
        
        # 2. Word-based similarity (order independent)
        words1 = set(norm_name1.split())
        words2 = set(norm_name2.split())
        
        if words1 and words2:
            word_similarity = len(words1.intersection(words2)) / len(words1.union(words2))
            similarities.append(word_similarity)
            
            # 3. Fuzzy word matching for OCR errors
            fuzzy_matches = 0
            total_words = len(words1)
            
            for word1 in words1:
                best_match = 0
                for word2 in words2:
                    # Use character-level similarity for individual words
                    word_sim = difflib.SequenceMatcher(None, word1, word2).ratio()
                    best_match = max(best_match, word_sim)
                
                # If word similarity is above threshold, count as match
                if best_match >= 0.6:  # 60% similarity threshold for individual words
                    fuzzy_matches += 1
            
            if total_words > 0:
                fuzzy_similarity = fuzzy_matches / total_words
                similarities.append(fuzzy_similarity)
        
        # 4. Character frequency similarity (helps with OCR scrambled text)
        chars1 = set(norm_name1.replace(' ', ''))
        chars2 = set(norm_name2.replace(' ', ''))
        
        if chars1 and chars2:
            char_similarity = len(chars1.intersection(chars2)) / len(chars1.union(chars2))
            similarities.append(char_similarity * 0.7)  # Weight less than word similarity
        
        # 5. Length-normalized edit distance
        max_len = max(len(norm_name1), len(norm_name2))
        if max_len > 0:
            edit_distance = sum(1 for _ in difflib.unified_diff(norm_name1, norm_name2))
            edit_similarity = 1 - (edit_distance / (2 * max_len))  # Normalized
            similarities.append(max(0, edit_similarity))
        
        # Return the best similarity score
        return max(similarities) if similarities else 0.0
    
    @staticmethod
    def verify_names_match(
        profile_first_name: str, 
        profile_last_name: str, 
        extracted_name: str,
        threshold: float = 0.50  # Lowered threshold to account for OCR errors
    ) -> Tuple[bool, float, str]:
        """
        Verify if the names from profile match the extracted name from Ghana Card
        
        Returns:
            Tuple of (matches, similarity_score, message)
        """
        if not extracted_name:
            return False, 0.0, "No name could be extracted from Ghana Card image"
        
        profile_full_name = f"{profile_first_name} {profile_last_name}".strip()
        
        # Calculate similarity with enhanced fuzzy matching
        similarity = GhanaCardService.calculate_name_similarity(profile_full_name, extracted_name)
        
        # Try different name arrangements for better matching
        alternative_similarities = []
        
        # Try first name + last name vs extracted
        alt_sim1 = GhanaCardService.calculate_name_similarity(
            f"{profile_first_name} {profile_last_name}", extracted_name
        )
        alternative_similarities.append(alt_sim1)
        
        # Try last name + first name vs extracted (different order)
        alt_sim2 = GhanaCardService.calculate_name_similarity(
            f"{profile_last_name} {profile_first_name}", extracted_name
        )
        alternative_similarities.append(alt_sim2)
        
        # Try individual name components
        if profile_first_name:
            first_sim = GhanaCardService.calculate_name_similarity(profile_first_name, extracted_name)
            alternative_similarities.append(first_sim * 0.8)  # Weight less for partial match
        
        if profile_last_name:
            last_sim = GhanaCardService.calculate_name_similarity(profile_last_name, extracted_name)
            alternative_similarities.append(last_sim * 0.8)  # Weight less for partial match
        
        # Use the best similarity score
        best_similarity = max([similarity] + alternative_similarities)
        
        # Check if similarity meets threshold
        matches = best_similarity >= threshold
        
        if matches:
            message = f"Names match with {best_similarity:.1%} similarity"
        else:
            # More helpful error message for low similarity
            if best_similarity >= 0.3:
                message = f"Names have some similarity but do not meet verification threshold. Profile: '{profile_full_name}', Ghana Card: '{extracted_name}' (Similarity: {best_similarity:.1%}). Please ensure the image is clear and try again."
            else:
                message = f"Names do not match sufficiently. Profile: '{profile_full_name}', Ghana Card: '{extracted_name}' (Similarity: {best_similarity:.1%}). Please ensure the names match or contact support."
        
        return matches, best_similarity, message
    
    @staticmethod
    def validate_ghana_card_number(card_number: str) -> bool:
        """Validate Ghana Card number format"""
        if not card_number:
            return False
        
        # Ghana Card format: GHA-XXXXXXXXX-X
        pattern = r'^GHA-\d{9}-\d$'
        return bool(re.match(pattern, card_number.upper()))
    
    @staticmethod
    def extract_card_number_from_image(image_file) -> Optional[str]:
        """
        Extract Ghana Card number from the back of the card with improved OCR
        """
        try:
            # Extract all text from image using number-optimized settings
            extracted_text = GhanaCardService.extract_text_from_image(image_file, for_names=False)
            
            if not extracted_text:
                logger.warning("No text extracted from Ghana Card back image")
                return None
            
            logger.info(f"Extracted text from Ghana Card back: {extracted_text[:200]}...")
            
            # Clean up the text for better pattern matching
            cleaned_text = re.sub(r'[^\w\s-]', ' ', extracted_text)  # Remove special chars except dashes
            cleaned_text = re.sub(r'\s+', ' ', cleaned_text)  # Normalize whitespace
            
            # Multiple pattern attempts for robust extraction
            patterns = [
                # Standard format: GHA-###-######-#
                r'GHA[-\s]*(\d{3})[-\s]*(\d{6})[-\s]*(\d{1})',
                # Compact format: GHA##########
                r'GHA[^\d]*(\d{3})[^\d]*(\d{6})[^\d]*(\d{1})',
                # Alternative format: GHA ### ###### #
                r'GHA\s*(\d{3})\s*(\d{6})\s*(\d{1})',
                # Flexible format with any non-digit separators
                r'GHA[^0-9]*(\d{3})[^0-9]*(\d{6})[^0-9]*(\d{1})',
                # Look for 10-digit sequence after GHA
                r'GHA[^\d]*(\d{10})',
                # More flexible: any sequence of digits that could be a card number
                r'(\d{3}[-\s]*\d{6}[-\s]*\d{1})',
            ]
            
            for pattern in patterns:
                matches = re.findall(pattern, cleaned_text, re.IGNORECASE)
                
                if matches:
                    if len(matches[0]) == 3:  # Three capture groups
                        # Standard format with three groups
                        match = matches[0]
                        card_number = f"GHA-{match[0]}-{match[1]}-{match[2]}"
                        logger.info(f"Successfully extracted card number: {card_number}")
                        return card_number
                    elif len(matches[0]) == 1:  # Single capture group
                        # Handle single 10-digit number
                        digits = matches[0]
                        if len(digits) == 10:
                            card_number = f"GHA-{digits[:3]}-{digits[3:9]}-{digits[9]}"
                            logger.info(f"Successfully extracted card number: {card_number}")
                            return card_number
                        elif len(digits) >= 9:  # At least 9 digits
                            # Take first 9 digits + possible 10th
                            if len(digits) >= 10:
                                card_number = f"GHA-{digits[:3]}-{digits[3:9]}-{digits[9]}"
                            else:
                                # Missing check digit, but still try
                                card_number = f"GHA-{digits[:3]}-{digits[3:9]}-0"
                            logger.info(f"Successfully extracted card number: {card_number}")
                            return card_number
            
            # Last resort: look for any long sequence of digits
            digit_sequences = re.findall(r'\d{9,}', cleaned_text)
            if digit_sequences:
                digits = digit_sequences[0]
                if len(digits) >= 9:
                    # Format as Ghana Card number
                    if len(digits) >= 10:
                        card_number = f"GHA-{digits[:3]}-{digits[3:9]}-{digits[9]}"
                    else:
                        card_number = f"GHA-{digits[:3]}-{digits[3:9]}-0"
                    logger.info(f"Successfully extracted card number (fallback): {card_number}")
                    return card_number
                
            logger.warning("Could not find Ghana Card number pattern in extracted text")
            return None
            
        except Exception as e:
            logger.error(f"Error extracting card number: {str(e)}")
            return None

    @staticmethod
    def process_ghana_card_dual_sided(
        front_image_file,
        back_image_file,
        card_number: str, 
        profile_first_name: str, 
        profile_last_name: str
    ) -> Dict:
        """
        Process both front and back of Ghana Card and verify information
        
        Returns:
            Dictionary containing processing results
        """
        result = {
            'success': False,
            'extracted_name': None,
            'extracted_number': None,
            'name_verified': False,
            'number_verified': False,
            'similarity_score': 0.0,
            'message': '',
            'errors': []
        }
        
        try:
            # Validate input card number format
            if not GhanaCardService.validate_ghana_card_number(card_number):
                result['errors'].append("Invalid Ghana Card number format")
                return result
            
            # Extract name from front image
            extracted_name = GhanaCardService.extract_name_from_image(front_image_file)
            result['extracted_name'] = extracted_name
            
            # Extract card number from back image
            extracted_number = GhanaCardService.extract_card_number_from_image(back_image_file)
            result['extracted_number'] = extracted_number
            
            # Verify name from front
            name_verified = False
            if extracted_name:
                name_verified, similarity, name_message = GhanaCardService.verify_names_match(
                    profile_first_name, profile_last_name, extracted_name
                )
                result['name_verified'] = name_verified
                result['similarity_score'] = similarity
            else:
                name_message = "Could not extract name from Ghana Card front image. Please ensure the front image is clear and well-lit."
                result['errors'].append("Name extraction failed")
            
            # Verify card number from back
            number_verified = False
            if extracted_number:
                # Compare normalized versions
                input_normalized = card_number.upper().replace('-', '').replace(' ', '')
                extracted_normalized = extracted_number.upper().replace('-', '').replace(' ', '')
                number_verified = input_normalized == extracted_normalized
                result['number_verified'] = number_verified
                
                if not number_verified:
                    number_message = f"Card number mismatch. Provided: {card_number}, Found on card: {extracted_number}"
                else:
                    number_message = "Card number verified successfully"
            else:
                number_message = "Could not extract card number from Ghana Card back image. Please ensure the back image is clear and shows the full card number."
                result['errors'].append("Card number extraction failed")
            
            # Overall success depends on both verifications
            if name_verified and number_verified:
                result['success'] = True
                result['message'] = "Ghana Card verification successful - both name and number verified"
            elif name_verified and not number_verified:
                result['message'] = f"Name verified but card number verification failed: {number_message}"
            elif not name_verified and number_verified:
                result['message'] = f"Card number verified but name verification failed: {name_message}"
            else:
                result['message'] = f"Both verifications failed. Name: {name_message}. Number: {number_message}"
            
        except Exception as e:
            logger.error(f"Error processing dual-sided Ghana Card: {str(e)}")
            result['errors'].append(f"Processing error: {str(e)}")
            result['message'] = "An error occurred while processing your Ghana Card. Please try again with clearer images."
        
        return result

    @staticmethod
    def process_ghana_card(
        image_file, 
        card_number: str, 
        profile_first_name: str, 
        profile_last_name: str
    ) -> Dict:
        """
        Legacy method for single-image processing (kept for backward compatibility)
        """
        # For single image, assume it's the front and only verify name
        result = {
            'success': False,
            'extracted_name': None,
            'name_verified': False,
            'number_verified': False,
            'similarity_score': 0.0,
            'message': '',
            'errors': []
        }
        
        try:
            # Validate card number
            if not GhanaCardService.validate_ghana_card_number(card_number):
                result['errors'].append("Invalid Ghana Card number format")
                return result
            
            # Extract name from image
            extracted_name = GhanaCardService.extract_name_from_image(image_file)
            result['extracted_name'] = extracted_name
            
            if not extracted_name:
                result['errors'].append("Could not extract name from Ghana Card image")
                result['message'] = "Unable to read text from Ghana Card image. Please ensure the image is clear, well-lit, and the card is fully visible."
                return result
            
            # Verify names match
            name_verified, similarity, message = GhanaCardService.verify_names_match(
                profile_first_name, profile_last_name, extracted_name
            )
            
            result['name_verified'] = name_verified
            result['number_verified'] = True  # Assume number is correct for single image
            result['similarity_score'] = similarity
            result['message'] = message
            result['success'] = name_verified
            
            if not name_verified:
                result['errors'].append("Name on Ghana Card does not match profile name")
            
        except Exception as e:
            logger.error(f"Error processing Ghana Card: {str(e)}")
            result['errors'].append(f"Processing error: {str(e)}")
            result['message'] = "An error occurred while processing your Ghana Card. Please try again with a clearer image."
        
        return result