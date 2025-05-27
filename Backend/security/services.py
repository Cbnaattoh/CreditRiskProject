import numpy as np
from sklearn.ensemble import IsolationForest
from .models import BehavioralBiometrics, SuspiciousActivity
from django.conf import settings
import json
from datetime import datetime
import os
from django.core.exceptions import ImproperlyConfigured

class BehavioralAnalyzer:
    def __init__(self):
        if not getattr(settings, 'BEHAVIORAL_ANALYSIS_ENABLED', False):
            self.models = None
            self.thresholds = None
            return
            
        try:
            self.models = {
                'typing': self._load_model(settings.BEHAVIORAL_MODELS['TYPING_MODEL_PATH']),
                'mouse': self._load_model(settings.BEHAVIORAL_MODELS['MOUSE_MODEL_PATH'])
            }
            self.thresholds = settings.BEHAVIORAL_MODELS.get('THRESHOLDS', {
                'alert_threshold': 0.3,
                'update_threshold': 0.7
            })
        except Exception as e:
            raise ImproperlyConfigured(f"Behavioral analysis configuration error: {str(e)}")

    def analyze_behavior(self, user, current_behavior):
        if not settings.BEHAVIORAL_ANALYSIS_ENABLED:
            return 1.0  # Return perfect score when analysis is disabled
            
        # Get user's stored behavior profile
        try:
            profile = BehavioralBiometrics.objects.get(user=user)
        except BehavioralBiometrics.DoesNotExist:
            return 0.5  # Neutral score if no profile exists
            
        # Compare current behavior with profile
        typing_score = self._compare_typing(profile, current_behavior)
        mouse_score = self._compare_mouse(profile, current_behavior)
        
        # Calculate overall confidence score
        overall_score = 0.7 * typing_score + 0.3 * mouse_score
        
        # Update profile if behavior is consistent
        if overall_score > self.thresholds['update_threshold']:
            self._update_profile(profile, current_behavior)
        
        # Log suspicious activity if below threshold
        if overall_score < self.thresholds['alert_threshold']:
            self._log_suspicious_activity(user, current_behavior, overall_score)
            
        return overall_score
    
    def _compare_typing(self, profile, current_behavior):
        if not settings.BEHAVIORAL_ANALYSIS_ENABLED:
            return 1.0
            
        stored_patterns = np.array(profile.typing_pattern.get('features', []))
        current_pattern = np.array(current_behavior.get('typing', {}).get('features', []))
        
        if len(stored_patterns) == 0 or len(current_pattern) == 0:
            return 0.5
            
        clf = IsolationForest(contamination=0.1)
        clf.fit(stored_patterns)
        score = clf.decision_function([current_pattern])[0]
        return (score + 0.5)  # Normalize to 0-1 range
    
    def _compare_mouse(self, profile, current_behavior):
        if not settings.BEHAVIORAL_ANALYSIS_ENABLED:
            return 1.0
        return 0.7  # Placeholder implementation
    
    def _update_profile(self, profile, current_behavior):
        profile.typing_pattern = self._update_features(
            profile.typing_pattern,
            current_behavior.get('typing', {})
        )
        profile.mouse_movement = self._update_features(
            profile.mouse_movement,
            current_behavior.get('mouse', {})
        )
        profile.save()
    
    def _update_features(self, stored, current, alpha=0.2):
        if not stored:
            return current
            
        updated = {}
        for key in stored:
            if key in current:
                if isinstance(stored[key], (int, float)):
                    updated[key] = alpha * current[key] + (1 - alpha) * stored[key]
                elif isinstance(stored[key], list):
                    updated[key] = [
                        alpha * curr + (1 - alpha) * stored
                        for curr, stored in zip(current[key], stored[key])
                    ]
                else:
                    updated[key] = stored[key]
            else:
                updated[key] = stored[key]
        return updated
    
    def _log_suspicious_activity(self, user, behavior, score):
        SuspiciousActivity.objects.create(
            user=user,
            activity_type='LOGIN',
            ip_address=behavior.get('ip', ''),
            user_agent=behavior.get('user_agent', ''),
            confidence=score,
            details={
                'behavior': behavior,
                'expected_ranges': self._get_expected_ranges(user)
            }
        )
    
    def _get_expected_ranges(self, user):
        profile = BehavioralBiometrics.objects.get(user=user)
        return {
            'typing_speed': profile.typing_pattern.get('speed_range'),
            'mouse_speed': profile.mouse_movement.get('speed_range')
        }
    
    def _load_model(self, path):
        if not settings.BEHAVIORAL_ANALYSIS_ENABLED:
            return None
            
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model file not found at {path}")
        return None  # Placeholder for actual model loading