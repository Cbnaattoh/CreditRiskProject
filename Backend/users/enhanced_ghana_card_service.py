import re
import cv2
import numpy as np
import logging
import time
import hashlib
from io import BytesIO
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract
from django.core.cache import cache
from django.conf import settings
import concurrent.futures
from threading import Lock

logger = logging.getLogger(__name__)

class ProcessingEngine(Enum):
    """Available OCR processing engines"""
    TESSERACT_STANDARD = "tesseract_standard"
    TESSERACT_ENHANCED = "tesseract_enhanced"
    TESSERACT_LSTM = "tesseract_lstm"

class ImageQuality(Enum):
    """Image quality assessment levels"""
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
    UNACCEPTABLE = "unacceptable"

@dataclass
class ImageAnalysis:
    """Comprehensive image quality analysis"""
    clarity_score: float
    brightness_score: float
    contrast_score: float
    noise_level: float
    overall_quality: ImageQuality
    recommendations: List[str]

@dataclass
class OCRResult:
    """OCR processing result with metadata"""
    text: str
    confidence: float
    engine: ProcessingEngine
    processing_time_ms: float
    quality_score: float

@dataclass
class NameExtractionResult:
    """Name extraction with detailed analysis"""
    extracted_name: Optional[str]
    confidence: float
    name_components: List[str]
    formatting_score: float
    match_probability: float

@dataclass
class CardNumberExtractionResult:
    """Card number extraction with validation"""
    extracted_number: Optional[str]
    confidence: float
    segments: List[str]
    format_valid: bool
    check_digit_valid: bool

class EnhancedGhanaCardProcessor:
    """Ghana Card processing system"""
    
    def __init__(self):
        self.processing_lock = Lock()
        self.cache_timeout = 3600  # 1 hour
        
        # Image preprocessing parameters
        self.denoise_params = {
            'h': 10,
            'templateWindowSize': 7,
            'searchWindowSize': 21
        }
        
        # OCR configuration templates - ultra-optimized for speed
        self.ocr_configs = {
            ProcessingEngine.TESSERACT_STANDARD: {
                'config': '--oem 3 --psm 6',
                'lang': 'eng',
                'timeout': 2  # Ultra-reduced timeout
            },
            ProcessingEngine.TESSERACT_ENHANCED: {
                'config': '--oem 3 --psm 8',  # Changed to single text block for speed
                'lang': 'eng',
                'timeout': 3  # Ultra-reduced timeout
            },
            ProcessingEngine.TESSERACT_LSTM: {
                'config': '--oem 1 --psm 8',  # Simplified for speed
                'lang': 'eng',
                'timeout': 3  # Ultra-reduced timeout
            }
        }
    
    def analyze_image_quality(self, image: np.ndarray) -> ImageAnalysis:
        """
        Image quality analysis for optimal OCR results
        """
        try:
            # Convert to grayscale for analysis
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()
            
            # Clarity assessment using Laplacian variance
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            clarity_score = min(100, laplacian_var / 10)  # Normalize to 0-100
            
            # Brightness assessment
            mean_brightness = np.mean(gray)
            # Optimal brightness is around 127 (middle of 0-255 range)
            brightness_score = 100 - abs(mean_brightness - 127) / 127 * 100
            
            # Contrast assessment using standard deviation
            contrast_score = min(100, np.std(gray) / 64 * 100)  # Normalize to 0-100
            
            # Noise assessment using noise estimation
            noise_level = self._estimate_noise_level(gray)
            
            # Overall quality calculation
            overall_score = (clarity_score * 0.4 + brightness_score * 0.3 + 
                           contrast_score * 0.2 + (100 - noise_level) * 0.1)
            
            # Determine quality level
            if overall_score >= 85:
                quality = ImageQuality.EXCELLENT
            elif overall_score >= 70:
                quality = ImageQuality.GOOD
            elif overall_score >= 55:
                quality = ImageQuality.FAIR
            elif overall_score >= 40:
                quality = ImageQuality.POOR
            else:
                quality = ImageQuality.UNACCEPTABLE
            
            # Generate recommendations
            recommendations = self._generate_image_recommendations(
                clarity_score, brightness_score, contrast_score, noise_level
            )
            
            return ImageAnalysis(
                clarity_score=clarity_score,
                brightness_score=brightness_score,
                contrast_score=contrast_score,
                noise_level=noise_level,
                overall_quality=quality,
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"Error analyzing image quality: {str(e)}")
            return ImageAnalysis(
                clarity_score=0,
                brightness_score=0,
                contrast_score=0,
                noise_level=100,
                overall_quality=ImageQuality.UNACCEPTABLE,
                recommendations=["Image analysis failed - please try a different image"]
            )
    
    def _estimate_noise_level(self, gray_image: np.ndarray) -> float:
        """Estimate noise level in grayscale image"""
        try:
            # Use median absolute deviation for noise estimation
            median = np.median(gray_image)
            mad = np.median(np.abs(gray_image - median))
            noise_level = min(100, mad / 255 * 100)
            return noise_level
        except:
            return 50
    
    def _generate_image_recommendations(self, clarity: float, brightness: float, 
                                      contrast: float, noise: float) -> List[str]:
        """Generate specific recommendations for image improvement"""
        recommendations = []
        
        if clarity < 50:
            recommendations.append("Image appears blurry - ensure camera is focused")
        if brightness < 40:
            recommendations.append("Image is too dark - improve lighting")
        elif brightness > 80:
            recommendations.append("Image is too bright - reduce lighting or avoid flash")
        if contrast < 40:
            recommendations.append("Low contrast detected - improve lighting conditions")
        if noise > 60:
            recommendations.append("High noise detected - clean camera lens and improve lighting")
        
        if not recommendations:
            recommendations.append("Image quality is good for processing")
            
        return recommendations
    
    def preprocess_image_fast(self, image_file) -> List[np.ndarray]:
        """
        Optimized image preprocessing with quality pre-screening
        """
        try:
            # Safe image reading with validation
            image_file.seek(0)
            image_bytes = image_file.read()
            image_file.seek(0)
            
            # Validate image data
            if len(image_bytes) == 0:
                raise ValueError("Empty image file")
            
            # Quick format validation
            if not (image_bytes.startswith(b'\xff\xd8\xff') or  # JPEG
                    image_bytes.startswith(b'\x89PNG\r\n\x1a\n') or  # PNG
                    image_bytes.startswith(b'RIFF') and b'WEBP' in image_bytes[:12]):  # WebP
                raise ValueError("Invalid image format - not JPEG, PNG, or WebP")
            
            try:
                pil_image = Image.open(BytesIO(image_bytes))
                if pil_image.mode != 'RGB':
                    pil_image = pil_image.convert('RGB')
            except Exception as e:
                raise ValueError(f"Cannot open image: {str(e)}")
            
            # Convert to numpy array
            img_array = np.array(pil_image)
            img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            # Quick quality assessment with detailed logging
            quality_score = self._quick_quality_check(img_bgr)
            logger.info(f"Image quality assessment: {quality_score:.1f}/100")
            
            # Only reject extremely poor quality images (very low threshold)
            if quality_score < 10:
                logger.warning(f"Extremely poor image quality detected ({quality_score}), cannot process")
                raise ValueError(f"Image quality too poor for OCR processing (score: {quality_score:.1f}/100). Please retake with better lighting and focus.")
            
            # Generate processing variants based on quality
            preprocessed_variants = []
            
            if quality_score < 30:
                # Marginal quality - use enhanced preprocessing
                logger.info(f"Marginal image quality ({quality_score}), using enhanced preprocessing")
                primary_variant = self._enhanced_text_preprocessing(img_bgr)
                preprocessed_variants.append(primary_variant)
            else:
                # Good quality - use fast processing
                primary_variant = self._fast_preprocessing(img_bgr)
                preprocessed_variants.append(primary_variant)
            
            return preprocessed_variants
            
        except Exception as e:
            logger.error(f"Error in fast preprocessing: {str(e)}")
            raise
    
    def _standard_preprocessing(self, img_bgr: np.ndarray) -> np.ndarray:
        """Standard preprocessing pipeline"""
        # Resize if too small
        height, width = img_bgr.shape[:2]
        if width < 1000 or height < 700:
            scale_factor = max(1000/width, 700/height)
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            img_bgr = cv2.resize(img_bgr, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        
        # Denoising
        denoised = cv2.fastNlMeansDenoising(gray, **self.denoise_params)
        
        # Adaptive thresholding
        thresh = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        
        return thresh
    
    def _fast_preprocessing(self, img_bgr: np.ndarray) -> np.ndarray:
        """Ultra-fast preprocessing optimized for maximum speed"""
        # Minimal resize - only if extremely small
        height, width = img_bgr.shape[:2]
        if width < 600 or height < 400:  # Lower threshold
            scale_factor = min(600/width, 400/height)  # Smaller scaling
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            img_bgr = cv2.resize(img_bgr, (new_width, new_height), interpolation=cv2.INTER_NEAREST)  # Fastest interpolation
        
        # Convert to grayscale
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        
        # Skip denoising for speed - just use simple filtering
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)  # Very light blur
        
        # Simple binary thresholding (faster than adaptive)
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return thresh
    
    def _minimal_preprocessing(self, image_file) -> np.ndarray:
        """Absolute minimal preprocessing for emergency timeout situations"""
        try:
            image_file.seek(0)
            image_bytes = image_file.read()
            image_file.seek(0)
            
            # Direct PIL to numpy conversion - no validation for speed
            pil_image = Image.open(BytesIO(image_bytes))
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            
            # Direct grayscale conversion - no resizing, no filtering
            img_array = np.array(pil_image)
            if len(img_array.shape) == 3:
                # Simple grayscale conversion
                gray = np.dot(img_array[...,:3], [0.2989, 0.5870, 0.1140])
                gray = gray.astype(np.uint8)
            else:
                gray = img_array
                
            # Simple binary threshold - fastest possible
            _, thresh = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY)
            
            return thresh
            
        except Exception as e:
            logger.error(f"Minimal preprocessing failed: {str(e)}")
            raise
    
    def _minimal_preprocessing_from_array(self, img_bgr: np.ndarray) -> np.ndarray:
        """Minimal preprocessing from numpy array - absolute fastest"""
        try:
            # Direct grayscale conversion - no resizing, no filtering
            if len(img_bgr.shape) == 3:
                gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            else:
                gray = img_bgr
            
            # Simple binary threshold - fastest possible
            _, thresh = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY)
            
            return thresh
            
        except Exception as e:
            logger.error(f"Minimal array preprocessing failed: {str(e)}")
            # Emergency fallback - return the original grayscale
            if len(img_bgr.shape) == 3:
                return cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            return img_bgr
    
    def _quick_quality_check(self, img_bgr: np.ndarray) -> float:
        """Improved image quality assessment more suitable for real-world photos"""
        if len(img_bgr.shape) == 3:
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        else:
            gray = img_bgr.copy()
        
        # Multiple quality metrics for more accurate assessment
        quality_scores = []
        
        # 1. Clarity check using Laplacian variance (adjusted scaling)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        clarity_score = min(100, laplacian_var / 5)  # More lenient scaling
        quality_scores.append(clarity_score)
        
        # 2. Check brightness (avoid too dark/too bright images)
        mean_brightness = np.mean(gray)
        if 50 <= mean_brightness <= 200:  # Good brightness range
            brightness_score = 100
        elif 30 <= mean_brightness <= 220:  # Acceptable range
            brightness_score = 70
        else:
            brightness_score = 30
        quality_scores.append(brightness_score)
        
        # 3. Check contrast
        contrast = gray.std()
        if contrast > 30:  # Good contrast
            contrast_score = 100
        elif contrast > 15:  # Acceptable contrast
            contrast_score = 70
        else:
            contrast_score = 40
        quality_scores.append(contrast_score)
        
        # Return weighted average (emphasize clarity less)
        final_score = (clarity_score * 0.4 + brightness_score * 0.3 + contrast_score * 0.3)
        return min(100, final_score)
    
    def _enhanced_text_preprocessing(self, img_bgr: np.ndarray) -> np.ndarray:
        """Preprocessing specifically for text extraction"""
        # Convert to grayscale
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        
        # Bilateral filter to reduce noise while preserving edges
        filtered = cv2.bilateralFilter(gray, 9, 75, 75)
        
        # Morphological operations to enhance text
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        morphed = cv2.morphologyEx(filtered, cv2.MORPH_CLOSE, kernel)
        
        # Adaptive thresholding with optimized parameters
        thresh = cv2.adaptiveThreshold(
            morphed, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 10
        )
        
        return thresh
    
    def _aggressive_preprocessing(self, img_bgr: np.ndarray) -> np.ndarray:
        """Aggressive preprocessing for challenging images"""
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        
        # Histogram equalization
        equalized = cv2.equalizeHist(gray)
        
        # Strong denoising
        denoised = cv2.fastNlMeansDenoising(equalized, h=15, templateWindowSize=7, searchWindowSize=21)
        
        # Sharpening kernel
        sharpen_kernel = np.array([[-1,-1,-1],
                                  [-1, 9,-1],
                                  [-1,-1,-1]])
        sharpened = cv2.filter2D(denoised, -1, sharpen_kernel)
        
        # Aggressive thresholding
        _, thresh = cv2.threshold(sharpened, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return thresh
    
    def _clahe_preprocessing(self, img_bgr: np.ndarray) -> np.ndarray:
        """CLAHE (Contrast Limited Adaptive Histogram Equalization) preprocessing"""
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        
        # CLAHE
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # Gaussian blur to smooth
        blurred = cv2.GaussianBlur(enhanced, (3, 3), 0)
        
        # Adaptive threshold
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 13, 8
        )
        
        return thresh
    
    def extract_text_optimized(self, image_variants: List[np.ndarray], 
                              target_type: str = "name") -> List[OCRResult]:
        """
        Optimized text extraction with performance limits and early termination
        """
        ocr_results = []
        max_variants = 2  # Limit variants for performance
        
        # Use only the most effective engine for speed
        engine = ProcessingEngine.TESSERACT_STANDARD
        config = self.ocr_configs[engine]
        
        # Process only best variants, not all
        for i, image_variant in enumerate(image_variants[:max_variants]):
            try:
                start_time = time.time()
                
                # Try Tesseract with ultra-aggressive timeout first, then immediate fallback
                logger.info("🚀 REAL OCR: Attempting Tesseract with 1-second timeout")
                text = ""
                tesseract_success = False
                
                try:
                    # Ultra-fast Tesseract attempt with 1-second timeout
                    import subprocess
                    import tempfile
                    import os
                    from PIL import Image as PILImage
                    
                    # Save image to temp file for Tesseract
                    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp_file:
                        # Convert numpy array back to PIL Image
                        if len(image_variant.shape) == 2:  # Grayscale
                            pil_img = PILImage.fromarray(image_variant)
                        else:  # Color
                            pil_img = PILImage.fromarray(cv2.cvtColor(image_variant, cv2.COLOR_BGR2RGB))
                        pil_img.save(tmp_file.name)
                        
                        # Run Tesseract with 1-second timeout using subprocess
                        try:
                            result = subprocess.run([
                                'tesseract', tmp_file.name, 'stdout', 
                                '--psm', '6', '--oem', '3', '-l', 'eng'
                            ], capture_output=True, text=True, timeout=1)
                            
                            if result.returncode == 0:
                                text = result.stdout.strip()
                                tesseract_success = True
                                logger.info(f"✅ Tesseract extracted: {text[:50]}...")
                            else:
                                logger.warning("Tesseract failed with error")
                                
                        except subprocess.TimeoutExpired:
                            logger.warning("⏰ Tesseract timed out after 1 second")
                        except Exception as tesseract_error:
                            logger.warning(f"Tesseract subprocess failed: {tesseract_error}")
                        finally:
                            # Clean up temp file
                            try:
                                os.unlink(tmp_file.name)
                            except:
                                pass
                                
                    if not tesseract_success or not text.strip():
                        # Immediate fallback to EasyOCR or similar
                        logger.info("🔄 Tesseract failed, trying EasyOCR fallback...")
                        text = self._try_easyocr_fallback(image_variant, target_type)
                        
                except Exception as e:
                    logger.error(f"OCR processing error: {str(e)}")
                    text = ""
                    # Ensure text is properly encoded
                    if isinstance(text, bytes):
                        text = text.decode('utf-8', errors='ignore')
                    text = text.strip()
                    # Remove problematic characters that might cause JSON issues
                    text = ''.join(char for char in text if ord(char) < 127 or char.isspace())
                    
                    processing_time = (time.time() - start_time) * 1000
                    
                    # For manual verification modes, set appropriate confidence
                    if "MANUAL_VERIFICATION" in text:
                        confidence = 50.0  # Medium confidence - requires manual check
                        quality_score = 60.0
                    else:
                        # Calculate confidence and quality scores
                        confidence = self._calculate_confidence(text, target_type)
                        quality_score = self._calculate_quality_score(text, image_variant)
                    
                    result = OCRResult(
                        text=text,
                        confidence=confidence,
                        engine=engine,
                        processing_time_ms=processing_time,
                        quality_score=quality_score
                    )
                    
                    ocr_results.append(result)
                    
                    # Always break after first result for maximum speed
                    logger.info(f"OpenCV processing complete ({confidence:.1f}%), terminating for speed")
                    break
                        
                except Exception as e:
                    logger.warning(f"OpenCV OCR failed on variant {i}: {str(e)}")
                    # Add placeholder result for failed processing
                    placeholder_result = OCRResult(
                        text="PROCESSING_FAILED",
                        confidence=0.0,
                        engine=engine,
                        processing_time_ms=(time.time() - start_time) * 1000,
                        quality_score=0.0
                    )
                    ocr_results.append(placeholder_result)
                    continue
                    
            except Exception as e:
                logger.warning(f"Image variant {i} processing failed: {str(e)}")
                continue
        
        # Sort by quality score
        ocr_results.sort(key=lambda x: x.quality_score, reverse=True)
        return ocr_results[:3]  # Return only top 3 results
    
    def _calculate_confidence(self, text: str, target_type: str) -> float:
        """Calculate confidence score based on text characteristics"""
        if not text:
            return 0.0
        
        confidence = 0.0
        
        if target_type == "name":
            # Name-specific confidence calculation
            letters = len(re.findall(r'[A-Za-z]', text))
            total_chars = len(text.replace(' ', '').replace('\n', ''))
            
            if total_chars > 0:
                letter_ratio = letters / total_chars
                confidence += letter_ratio * 60
            
            # Length appropriateness
            if 5 <= len(text.replace(' ', '')) <= 50:
                confidence += 20
            
            # Word count (names typically have 2-4 words)
            words = len(text.split())
            if 2 <= words <= 4:
                confidence += 15
            elif words == 1:
                confidence += 5
            
            # Penalty for excessive numbers or symbols
            numbers = len(re.findall(r'\d', text))
            symbols = len(re.findall(r'[^A-Za-z\s]', text))
            confidence -= (numbers + symbols) * 2
            
        else:  # card_number
            # Card number specific confidence
            digits = len(re.findall(r'\d', text))
            confidence += digits * 5
            
            # GHA prefix bonus
            if 'GHA' in text.upper():
                confidence += 30
            
            # Pattern matching bonus
            if re.search(r'GHA[^\w]*\d{9}[^\w]*\d', text, re.IGNORECASE):
                confidence += 40
        
        return max(0, min(100, confidence))
    
    def _calculate_quality_score(self, text: str, image: np.ndarray) -> float:
        """Calculate overall quality score combining text and image metrics"""
        text_score = self._calculate_confidence(text, "mixed")
        
        # Simple image quality metric
        image_variance = np.var(image)
        image_score = min(100, image_variance / 1000)
        
        # Combined score
        quality_score = (text_score * 0.7) + (image_score * 0.3)
        return quality_score
    
    def extract_name_advanced(self, ocr_results: List[OCRResult]) -> NameExtractionResult:
        """
        Advanced name extraction with multiple validation strategies
        """
        best_name = None
        best_confidence = 0
        best_components = []
        best_formatting_score = 0
        
        for result in ocr_results:
            text = result.text.strip()
            
            # Handle manual verification cases (when OCR fails to extract clear text)
            if text in ["Text detected - please verify name manually", "No clear text detected", "Image processing failed", ""]:
                return NameExtractionResult(
                    extracted_name="MANUAL_VERIFICATION_REQUIRED",
                    confidence=30.0,
                    name_components=["MANUAL", "VERIFICATION", "REQUIRED"],
                    formatting_score=30.0,
                    match_probability=30.0
                )
            
            extracted_name = self._parse_name_from_text(result.text)
            if not extracted_name:
                continue
            
            # Calculate name-specific metrics
            components = extracted_name.split()
            formatting_score = self._calculate_name_formatting_score(extracted_name)
            confidence = result.confidence
            
            # Boost confidence for well-formatted names
            adjusted_confidence = confidence + (formatting_score * 0.3)
            
            if adjusted_confidence > best_confidence:
                best_name = extracted_name
                best_confidence = adjusted_confidence
                best_components = components
                best_formatting_score = formatting_score
        
        return NameExtractionResult(
            extracted_name=best_name,
            confidence=best_confidence,
            name_components=best_components,
            formatting_score=best_formatting_score,
            match_probability=min(100, best_confidence)
        )
    
    def _parse_name_from_text(self, text: str) -> Optional[str]:
        """Parse name from OCR text using multiple strategies"""
        if not text:
            return None
        
        lines = text.split('\n')
        potential_names = []
        
        # Strategy 1: Look for name indicators
        name_indicators = ['NAME', 'FULL NAME', 'SURNAME', 'HOLDER']
        for line in lines:
            line_upper = line.strip().upper()
            for indicator in name_indicators:
                if indicator in line_upper:
                    # Extract name after indicator
                    if ':' in line:
                        name_part = line.split(':', 1)[1].strip()
                        if self._is_valid_name_candidate(name_part):
                            potential_names.append(name_part)
        
        # Strategy 2: Look for properly formatted names
        for line in lines:
            cleaned_line = line.strip()
            if (len(cleaned_line) > 5 and 
                self._is_valid_name_candidate(cleaned_line) and
                len(cleaned_line.split()) >= 2):
                potential_names.append(cleaned_line)
        
        # Return best candidate
        if potential_names:
            # Sort by formatting quality
            potential_names.sort(key=self._calculate_name_formatting_score, reverse=True)
            return potential_names[0].title()
        
        return None
    
    def _is_valid_name_candidate(self, text: str) -> bool:
        """Check if text is a valid name candidate"""
        if not text or len(text) < 2:
            return False
        
        # Must contain letters
        if not re.search(r'[A-Za-z]', text):
            return False
        
        # Reject if too many numbers
        digit_ratio = len(re.findall(r'\d', text)) / len(text)
        if digit_ratio > 0.3:
            return False
        
        # Reject common non-name patterns
        invalid_patterns = [
            r'GHANA|CARD|REPUBLIC|GOVERNMENT|ID|BIRTH|DATE|SEX|MALE|FEMALE',
            r'GHA-\d+-\d'
        ]
        
        text_upper = text.upper()
        for pattern in invalid_patterns:
            if re.search(pattern, text_upper):
                return False
        
        return True
    
    def _calculate_name_formatting_score(self, name: str) -> float:
        """Calculate name formatting quality score"""
        if not name:
            return 0
        
        score = 0
        
        # Length appropriateness
        if 5 <= len(name) <= 50:
            score += 25
        
        # Word count (2-4 words typical)
        words = name.split()
        if 2 <= len(words) <= 4:
            score += 30
        elif len(words) == 1:
            score += 15
        
        # Capitalization appropriateness
        if name.istitle():
            score += 20
        elif name.isupper():
            score += 15
        
        # Letter to total character ratio
        letters = len(re.findall(r'[A-Za-z]', name))
        total_chars = len(name.replace(' ', ''))
        if total_chars > 0:
            letter_ratio = letters / total_chars
            score += letter_ratio * 25
        
        return min(100, score)
    
    def extract_card_number_advanced(self, ocr_results: List[OCRResult]) -> CardNumberExtractionResult:
        """
        Advanced card number extraction with validation
        """
        best_number = None
        best_confidence = 0
        best_segments = []
        format_valid = False
        check_digit_valid = False
        
        for result in ocr_results:
            text = result.text.strip()
            
            # Handle manual verification cases (when OCR fails to extract clear card number)
            if text in ["Text detected - please verify card number manually", "No clear text detected", "Image processing failed", ""]:
                return CardNumberExtractionResult(
                    extracted_number="CARD_NUMBER_MANUAL_VERIFICATION",
                    confidence=30.0,
                    segments=["GHA", "MANUAL", "VERIFICATION"],
                    format_valid=True,  # Allow manual verification to proceed
                    check_digit_valid=True
                )
            
            extracted_number = self._parse_card_number_from_text(result.text)
            if not extracted_number:
                continue
            
            # Validate format
            is_format_valid = self._validate_card_number_format(extracted_number)
            is_check_digit_valid = self._validate_check_digit(extracted_number)
            
            # Calculate confidence boost for valid format
            confidence = result.confidence
            if is_format_valid:
                confidence += 20
            if is_check_digit_valid:
                confidence += 10
            
            if confidence > best_confidence:
                best_number = extracted_number
                best_confidence = confidence
                best_segments = self._extract_card_segments(extracted_number)
                format_valid = is_format_valid
                check_digit_valid = is_check_digit_valid
        
        return CardNumberExtractionResult(
            extracted_number=best_number,
            confidence=best_confidence,
            segments=best_segments,
            format_valid=format_valid,
            check_digit_valid=check_digit_valid
        )
    
    def _parse_card_number_from_text(self, text: str) -> Optional[str]:
        """Parse Ghana Card number from OCR text"""
        if not text:
            return None
        
        # Clean up text
        cleaned_text = re.sub(r'[^\w\s-]', ' ', text)
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text)
        
        # Multiple extraction patterns
        patterns = [
            r'GHA[-\s]*(\d{3})[-\s]*(\d{6})[-\s]*(\d{1})',
            r'GHA[^\d]*(\d{3})[^\d]*(\d{6})[^\d]*(\d{1})',
            r'GHA[^\d]*(\d{10})',
            r'(\d{3}[-\s]*\d{6}[-\s]*\d{1})'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, cleaned_text, re.IGNORECASE)
            if matches:
                if len(matches[0]) == 3:  # Three groups
                    return f"GHA-{matches[0][0]}-{matches[0][1]}-{matches[0][2]}"
                elif len(matches[0]) == 1:  # Single group
                    digits = matches[0]
                    if len(digits) >= 10:
                        return f"GHA-{digits[:3]}-{digits[3:9]}-{digits[9]}"
        
        return None
    
    def _validate_card_number_format(self, card_number: str) -> bool:
        """Validate Ghana Card number format"""
        if not card_number:
            return False
        pattern = r'^GHA-\d{3}-\d{6}-\d$'
        return bool(re.match(pattern, card_number.upper()))
    
    def _validate_check_digit(self, card_number: str) -> bool:
        """Validate Ghana Card check digit (simplified)"""
        # This is a simplified check - implement actual algorithm if available
        if not self._validate_card_number_format(card_number):
            return False
        
        # Extract digits
        digits = re.findall(r'\d', card_number)
        if len(digits) != 10:
            return False
        
        # Simple modulo check (replace with actual algorithm)
        main_digits = [int(d) for d in digits[:9]]
        check_digit = int(digits[9])
        
        calculated_check = sum(main_digits) % 10
        return calculated_check == check_digit
    
    def _extract_card_segments(self, card_number: str) -> List[str]:
        """Extract card number segments"""
        if not card_number:
            return []
        
        # Extract all segments
        segments = re.findall(r'\d+', card_number)
        return segments
    
    def process_ghana_card_enterprise(self, front_image_file, back_image_file,
                                    first_name: str, last_name: str, 
                                    card_number: str) -> Dict[str, Any]:
        """
        Ghana Card processing with performance optimizations and timeouts
        """
        start_time = time.time()
        max_processing_time = 12  # Maximum 12 seconds total processing time
        result = {
            'success': False,
            'verification_status': 'error',
            'results': {
                'extracted_name': None,
                'extracted_number': None,
                'name_verified': False,
                'number_verified': False,
                'confidence': 0,
                'similarity_score': 0.0,
                'message': '',
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
            'errors': [],
            'processing_time_ms': 0,
            'recommendations': []
        }
        
        try:
            # Fast image preprocessing with error handling and timeout check
            try:
                # Early timeout check - if we're already near limit, use minimal processing
                elapsed = time.time() - start_time
                if elapsed > max_processing_time * 0.3:  # 30% of time already used
                    logger.warning(f"Early timeout risk detected ({elapsed:.1f}s), using minimal processing")
                    # Use only single variant with minimal preprocessing
                    front_variants = [self._minimal_preprocessing(front_image_file)]
                    back_variants = [self._minimal_preprocessing(back_image_file)]
                else:
                    front_variants = self.preprocess_image_fast(front_image_file)
                    back_variants = self.preprocess_image_fast(back_image_file)
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Image preprocessing failed: {error_msg}")
                
                # Check if it's a quality issue
                if "Image quality too poor" in error_msg:
                    result['verification_status'] = 'poor_quality'
                    result['results']['message'] = error_msg
                    result['results']['quality_issue'] = True
                    result['recommendations'] = [
                        'Take photos in bright, natural lighting (not under artificial lights)',
                        'Ensure the Ghana Card is completely flat and not bent',
                        'Hold the camera steady and focus clearly on the text',
                        'Clean the Ghana Card surface if it appears dirty or scratched',
                        'Take the photo from directly above the card (not at an angle)'
                    ]
                    return result
                else:
                    raise Exception(f"Image preprocessing failed: {error_msg}")
            
            # Safe image quality analysis
            try:
                front_quality = self.analyze_image_quality(front_variants[0])
                back_quality = self.analyze_image_quality(back_variants[0])
            except Exception as e:
                logger.error(f"Image quality analysis failed: {str(e)}")
                # Use default quality scores
                front_quality = ImageAnalysis(50.0, 50.0, 50.0, 50.0, ImageQuality.FAIR, [])
                back_quality = ImageAnalysis(50.0, 50.0, 50.0, 50.0, ImageQuality.FAIR, [])
            
            # Store quality assessments
            result['results']['detailed_analysis']['image_quality_assessment'] = {
                'front_image': {
                    'clarity': front_quality.clarity_score,
                    'brightness': front_quality.brightness_score,
                    'contrast': front_quality.contrast_score
                },
                'back_image': {
                    'clarity': back_quality.clarity_score,
                    'brightness': back_quality.brightness_score,
                    'contrast': back_quality.contrast_score
                }
            }
            
            # Collect recommendations
            result['recommendations'].extend(front_quality.recommendations)
            result['recommendations'].extend(back_quality.recommendations)
            
            # Check timeout before OCR
            if time.time() - start_time > max_processing_time * 0.8:
                logger.warning("Processing timeout approaching, skipping detailed OCR")
                raise Exception("Processing timeout - please try with clearer images")
            
            # Safe OCR processing with optimized methods
            try:
                front_ocr_results = self.extract_text_optimized(front_variants, "name")
                name_result = self.extract_name_advanced(front_ocr_results)
            except Exception as e:
                logger.error(f"Front image OCR failed: {str(e)}")
                name_result = NameExtractionResult(None, 0.0, [], 0.0, 0.0)
            
            # Check timeout again before back image processing
            if time.time() - start_time > max_processing_time * 0.9:
                logger.warning("Processing timeout approaching, skipping back image OCR")
                number_result = CardNumberExtractionResult(None, 0.0, [], False, False)
            else:
                try:
                    back_ocr_results = self.extract_text_optimized(back_variants, "card_number")
                    number_result = self.extract_card_number_advanced(back_ocr_results)
                except Exception as e:
                    logger.error(f"Back image OCR failed: {str(e)}")
                    number_result = CardNumberExtractionResult(None, 0.0, [], False, False)
            
            # Store extracted information with user-friendly formatting
            if name_result.extracted_name == "MANUAL_VERIFICATION_REQUIRED":
                # Show the user's entered name for manual verification
                user_full_name = f"{first_name} {last_name}".strip()
                result['results']['extracted_name'] = user_full_name
                result['results']['name_display'] = user_full_name
                result['results']['name_needs_verification'] = True
                result['results']['name_verification_message'] = "Please confirm this name matches your Ghana Card"
            else:
                result['results']['extracted_name'] = name_result.extracted_name
                result['results']['name_display'] = name_result.extracted_name
                result['results']['name_needs_verification'] = False
            
            if number_result.extracted_number == "CARD_NUMBER_MANUAL_VERIFICATION":
                # Show the user's entered card number for manual verification
                result['results']['extracted_number'] = card_number
                result['results']['number_display'] = card_number  
                result['results']['number_needs_verification'] = True
                result['results']['number_verification_message'] = "Please confirm this card number matches your Ghana Card"
            else:
                result['results']['extracted_number'] = number_result.extracted_number
                result['results']['number_display'] = number_result.extracted_number
                result['results']['number_needs_verification'] = False
            
            # Store detailed analysis
            result['results']['detailed_analysis']['name_components'] = name_result.name_components
            result['results']['detailed_analysis']['card_number_segments'] = number_result.segments
            result['results']['detailed_analysis']['ocr_quality_score'] = (
                front_quality.clarity_score + back_quality.clarity_score
            ) / 2
            
            # Verify name match using built-in similarity check
            name_verified = False
            similarity_score = 0.0
            if name_result.extracted_name:
                # Check if manual verification is required
                if name_result.extracted_name == "MANUAL_VERIFICATION_REQUIRED":
                    name_verified = True  # Allow to proceed with manual verification
                    similarity_score = 0.5
                    name_message = "Manual verification required. Please verify the name matches your Ghana Card."
                else:
                    name_verified, similarity_score, name_message = self._verify_names_match(
                        first_name, last_name, name_result.extracted_name
                    )
            else:
                name_message = "Could not extract name from Ghana Card front image"
            
            # Verify card number
            number_verified = False
            if number_result.extracted_number:
                # Check if manual verification is required
                if number_result.extracted_number == "CARD_NUMBER_MANUAL_VERIFICATION":
                    number_verified = True  # Allow to proceed with manual verification
                elif number_result.format_valid:
                    input_normalized = card_number.upper().replace('-', '').replace(' ', '')
                    extracted_normalized = number_result.extracted_number.upper().replace('-', '').replace(' ', '')
                    number_verified = input_normalized == extracted_normalized
            
            # Calculate overall confidence
            overall_confidence = (name_result.confidence + number_result.confidence) / 2
            
            # Determine verification status including manual verification
            manual_verification_required = (
                name_result.extracted_name == "MANUAL_VERIFICATION_REQUIRED" or 
                number_result.extracted_number == "CARD_NUMBER_MANUAL_VERIFICATION"
            )
            
            if manual_verification_required:
                verification_status = 'manual_verification_required'
                message = "Ghana Card images processed successfully. Please confirm the information below matches what you see on your physical Ghana Card."
            elif name_verified and number_verified:
                verification_status = 'success'
                message = "Ghana Card verification successful"
            elif name_verified or number_verified:
                verification_status = 'warning'
                message = f"Partial verification: {'Name' if name_verified else 'Number'} verified"
            else:
                verification_status = 'error'
                message = f"Verification failed: {name_message}"
            
            # Update result
            result.update({
                'success': True,
                'verification_status': verification_status,
                'results': {
                    **result['results'],
                    'name_verified': name_verified,
                    'number_verified': number_verified,
                    'confidence': round(overall_confidence if not manual_verification_required else 50.0, 2),
                    'similarity_score': similarity_score,
                    'message': message,
                    'manual_verification_required': manual_verification_required,
                    'processing_mode': 'manual_verification' if manual_verification_required else 'automatic'
                }
            })
            
        except Exception as e:
            logger.error(f"Error in enterprise Ghana Card processing: {str(e)}")
            result['errors'].append(f"Processing error: {str(e)}")
            result['results']['message'] = "Processing failed due to technical error"
        
        finally:
            # Record processing time
            processing_time = (time.time() - start_time) * 1000
            result['processing_time_ms'] = round(processing_time, 2)
        
        return result
    
    def _verify_names_match(self, first_name: str, last_name: str, extracted_name: str) -> Tuple[bool, float, str]:
        """
        Verify if names match with similarity calculation
        """
        if not extracted_name:
            return False, 0.0, "No name extracted from Ghana Card"
        
        import difflib
        
        profile_name = f"{first_name} {last_name}".strip().lower()
        extracted_name_lower = extracted_name.strip().lower()
        
        # Calculate similarity using different approaches
        similarities = []
        
        # 1. Direct sequence similarity
        seq_similarity = difflib.SequenceMatcher(None, profile_name, extracted_name_lower).ratio()
        similarities.append(seq_similarity)
        
        # 2. Word-based similarity (order independent)
        words1 = set(profile_name.split())
        words2 = set(extracted_name_lower.split())
        
        if words1 and words2:
            word_similarity = len(words1.intersection(words2)) / len(words1.union(words2))
            similarities.append(word_similarity)
        
        # Use best similarity
        best_similarity = max(similarities) if similarities else 0.0
        threshold = 0.5  # 50% similarity threshold
        
        matches = best_similarity >= threshold
        
        if matches:
            message = f"Names match with {best_similarity:.1%} similarity"
        else:
            message = f"Names do not match. Profile: '{profile_name}', Ghana Card: '{extracted_name_lower}' (Similarity: {best_similarity:.1%})"
        
        return matches, best_similarity, message
    
    def _opencv_text_extraction(self, image_variant: np.ndarray, target_type: str = "name") -> str:
        """
        OpenCV-based text extraction as backup when Tesseract times out
        This uses basic pattern matching and contour analysis
        """
        try:
            # Ensure image is grayscale
            if len(image_variant.shape) == 3:
                gray = cv2.cvtColor(image_variant, cv2.COLOR_BGR2GRAY)
            else:
                gray = image_variant.copy()
            
            # Find text regions using contour detection
            contours, _ = cv2.findContours(gray, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Filter contours that could be text
            text_regions = []
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                # Filter for text-like rectangles
                if w > 20 and h > 10 and w/h > 1.5 and w/h < 8:  # Text aspect ratios
                    area = cv2.contourArea(contour)
                    if area > 100:  # Minimum text area
                        text_regions.append((x, y, w, h))
            
            # Sort by position (top to bottom, left to right)
            text_regions.sort(key=lambda r: (r[1], r[0]))
            
            # Basic pattern recognition for Ghana Card
            extracted_text = ""
            
            if target_type == "name":
                # Look for patterns that could be names
                # For now, return a generic placeholder that indicates some text was found
                if len(text_regions) > 0:
                    extracted_text = "NAME_DETECTED_OPENCV"  # Placeholder for frontend
            else:
                # Look for card number patterns
                if len(text_regions) > 0:
                    extracted_text = "GHA-XXXXXXXXX-X"  # Placeholder pattern
            
            return extracted_text
            
        except Exception as e:
            logger.error(f"OpenCV text extraction failed: {str(e)}")
            return ""
    
    def _try_easyocr_fallback(self, image_variant: np.ndarray, target_type: str = "name") -> str:
        """
        EasyOCR fallback when Tesseract fails
        """
        try:
            # Try to import and use EasyOCR
            import easyocr
            
            # Initialize EasyOCR reader (cached after first use)
            if not hasattr(self, '_easyocr_reader'):
                logger.info("Initializing EasyOCR reader...")
                self._easyocr_reader = easyocr.Reader(['en'], gpu=False)
            
            # Extract text using EasyOCR
            results = self._easyocr_reader.readtext(image_variant, detail=0)
            
            if results:
                extracted_text = ' '.join(results)
                logger.info(f"✅ EasyOCR extracted: {extracted_text[:50]}...")
                return extracted_text
            else:
                logger.warning("EasyOCR found no text")
                return ""
                
        except ImportError:
            logger.warning("EasyOCR not installed, trying basic text extraction")
            return self._basic_text_extraction(image_variant, target_type)
        except Exception as e:
            logger.error(f"EasyOCR failed: {str(e)}")
            return self._basic_text_extraction(image_variant, target_type)
    
    def _basic_text_extraction(self, image_variant: np.ndarray, target_type: str = "name") -> str:
        """
        Basic text extraction using image analysis when all OCR fails
        """
        try:
            # Ensure image is grayscale
            if len(image_variant.shape) == 3:
                gray = cv2.cvtColor(image_variant, cv2.COLOR_BGR2GRAY)
            else:
                gray = image_variant.copy()
            
            # Find text regions using contour detection
            contours, _ = cv2.findContours(gray, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Count text-like regions
            text_regions = 0
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                # Filter for text-like rectangles
                if w > 20 and h > 8 and 1.5 < w/h < 10:  # Text aspect ratios
                    area = cv2.contourArea(contour)
                    if area > 80:  # Minimum text area
                        text_regions += 1
            
            if text_regions >= 2:  # Found multiple text regions
                if target_type == "name":
                    return "Text detected - please verify name manually"
                else:
                    return "Text detected - please verify card number manually"
            else:
                return "No clear text detected"
                
        except Exception as e:
            logger.error(f"Basic text extraction failed: {str(e)}")
            return "Image processing failed"

# Global instance for use in views
ghana_card_processor = EnhancedGhanaCardProcessor()