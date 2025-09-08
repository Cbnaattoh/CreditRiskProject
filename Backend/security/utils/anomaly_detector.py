import logging
import numpy as np
from datetime import datetime, timedelta
from django.utils.timezone import now
from django.contrib.auth import get_user_model
from ..models import SuspiciousActivity, BehavioralBiometrics

User = get_user_model()
logger = logging.getLogger(__name__)

class AnomalyDetector:
    """
    Advanced anomaly detection system for identifying suspicious user activities.
    """
    
    def __init__(self):
        self.anomaly_rules = {
            # Rate limiting rules
            'max_requests_per_minute': 60,
            'max_failed_logins_per_hour': 5,
            'max_password_attempts_per_hour': 3,
            
            # Behavioral thresholds
            'confidence_threshold': 0.3,
            'velocity_anomaly_threshold': 3.0,  # Standard deviations
            'timing_anomaly_threshold': 2.0,
            
            # Geographic rules
            'max_location_distance': 1000,  # km
            'impossible_travel_speed': 800,  # km/h (commercial flight)
            
            # Session rules
            'max_concurrent_sessions': 3,
            'session_timeout_minutes': 30,
        }

    def analyze_activity(self, user, activity_data):
        """
        Analyze user activity for suspicious patterns.
        
        Args:
            user: Django User instance
            activity_data: Dict containing activity information
            
        Returns:
            tuple: (is_suspicious, confidence_score, details)
        """
        try:
            suspicious_indicators = []
            confidence_scores = []
            
            # Check rate limiting anomalies
            rate_anomalies = self._check_rate_anomalies(user, activity_data)
            suspicious_indicators.extend(rate_anomalies)
            
            # Check behavioral anomalies
            behavioral_anomalies = self._check_behavioral_anomalies(user, activity_data)
            suspicious_indicators.extend(behavioral_anomalies)
            
            # Check geographic anomalies
            geo_anomalies = self._check_geographic_anomalies(user, activity_data)
            suspicious_indicators.extend(geo_anomalies)
            
            # Check timing anomalies
            timing_anomalies = self._check_timing_anomalies(user, activity_data)
            suspicious_indicators.extend(timing_anomalies)
            
            # Check session anomalies
            session_anomalies = self._check_session_anomalies(user, activity_data)
            suspicious_indicators.extend(session_anomalies)
            
            # Calculate overall suspicion score
            if suspicious_indicators:
                # Weight different types of anomalies
                weights = {
                    'rate_limit': 0.8,
                    'behavioral': 0.9,
                    'geographic': 0.7,
                    'timing': 0.6,
                    'session': 0.5
                }
                
                weighted_scores = []
                for indicator in suspicious_indicators:
                    weight = weights.get(indicator['type'], 0.5)
                    weighted_scores.append(indicator['score'] * weight)
                
                avg_confidence = np.mean(weighted_scores)
                is_suspicious = avg_confidence >= 0.5
                
                details = {
                    'suspicious_indicators': suspicious_indicators,
                    'analysis_timestamp': now().isoformat(),
                    'user_id': user.id,
                    'activity_type': activity_data.get('activity_type', 'UNKNOWN'),
                    'confidence_breakdown': {
                        indicator['type']: indicator['score'] 
                        for indicator in suspicious_indicators
                    }
                }
                
                logger.info(
                    f"Anomaly analysis for user {user.id}: "
                    f"suspicious={is_suspicious}, confidence={avg_confidence:.3f}, "
                    f"indicators={len(suspicious_indicators)}"
                )
                
                return is_suspicious, avg_confidence, details
            
            else:
                # No anomalies detected
                return False, 0.1, {
                    'analysis_timestamp': now().isoformat(),
                    'user_id': user.id,
                    'status': 'normal_activity'
                }
                
        except Exception as e:
            logger.error(f"Error in anomaly detection: {e}")
            return False, 0.0, {'error': str(e)}

    def _check_rate_anomalies(self, user, activity_data):
        """Check for rate limiting anomalies."""
        anomalies = []
        current_time = now()
        
        try:
            activity_type = activity_data.get('activity_type', '')
            
            # Check general request rate
            recent_activities = SuspiciousActivity.objects.filter(
                user=user,
                detected_at__gte=current_time - timedelta(minutes=1)
            ).count()
            
            if recent_activities > self.anomaly_rules['max_requests_per_minute']:
                anomalies.append({
                    'type': 'rate_limit',
                    'indicator': 'excessive_requests',
                    'score': min(1.0, recent_activities / self.anomaly_rules['max_requests_per_minute']),
                    'details': f'Made {recent_activities} requests in the last minute',
                    'severity': 'HIGH' if recent_activities > 100 else 'MEDIUM'
                })
            
            # Check failed login attempts
            if activity_type == 'LOGIN':
                failed_logins = SuspiciousActivity.objects.filter(
                    user=user,
                    activity_type='LOGIN',
                    was_successful=False,
                    detected_at__gte=current_time - timedelta(hours=1)
                ).count()
                
                if failed_logins > self.anomaly_rules['max_failed_logins_per_hour']:
                    anomalies.append({
                        'type': 'rate_limit',
                        'indicator': 'excessive_failed_logins',
                        'score': min(1.0, failed_logins / self.anomaly_rules['max_failed_logins_per_hour']),
                        'details': f'{failed_logins} failed login attempts in the last hour',
                        'severity': 'HIGH'
                    })
            
            # Check password change attempts
            if activity_type == 'PASSWORD':
                password_attempts = SuspiciousActivity.objects.filter(
                    user=user,
                    activity_type='PASSWORD',
                    detected_at__gte=current_time - timedelta(hours=1)
                ).count()
                
                if password_attempts > self.anomaly_rules['max_password_attempts_per_hour']:
                    anomalies.append({
                        'type': 'rate_limit',
                        'indicator': 'excessive_password_changes',
                        'score': min(1.0, password_attempts / self.anomaly_rules['max_password_attempts_per_hour']),
                        'details': f'{password_attempts} password change attempts in the last hour',
                        'severity': 'MEDIUM'
                    })
            
        except Exception as e:
            logger.error(f"Error checking rate anomalies: {e}")
        
        return anomalies

    def _check_behavioral_anomalies(self, user, activity_data):
        """Check for behavioral pattern anomalies."""
        anomalies = []
        
        try:
            # Get user's behavioral baseline
            biometric = BehavioralBiometrics.objects.filter(user=user).first()
            if not biometric:
                return anomalies  # No baseline to compare against
            
            # Check confidence score threshold
            if biometric.confidence_score < self.anomaly_rules['confidence_threshold']:
                anomalies.append({
                    'type': 'behavioral',
                    'indicator': 'low_behavioral_confidence',
                    'score': 1.0 - biometric.confidence_score,
                    'details': f'Behavioral confidence score: {biometric.confidence_score:.3f}',
                    'severity': 'HIGH' if biometric.confidence_score < 0.2 else 'MEDIUM'
                })
            
            # Check for sudden behavioral changes
            if biometric.risk_level == 'HIGH':
                anomalies.append({
                    'type': 'behavioral',
                    'indicator': 'high_risk_behavioral_profile',
                    'score': 0.8,
                    'details': 'User has high-risk behavioral profile',
                    'severity': 'HIGH'
                })
            
            # Check for device/interaction anomalies
            processing_time = activity_data.get('processing_time', 0)
            if processing_time > 10:  # Very slow response might indicate automated tools
                anomalies.append({
                    'type': 'behavioral',
                    'indicator': 'unusual_processing_time',
                    'score': min(1.0, processing_time / 30),
                    'details': f'Unusually slow processing time: {processing_time:.2f}s',
                    'severity': 'LOW'
                })
            
        except Exception as e:
            logger.error(f"Error checking behavioral anomalies: {e}")
        
        return anomalies

    def _check_geographic_anomalies(self, user, activity_data):
        """Check for geographic/location anomalies."""
        anomalies = []
        
        try:
            current_ip = activity_data.get('ip_address')
            if not current_ip or current_ip == '127.0.0.1':
                return anomalies  # Skip local/development IPs
            
            # Get recent activity locations
            recent_activities = SuspiciousActivity.objects.filter(
                user=user,
                detected_at__gte=now() - timedelta(hours=24)
            ).exclude(
                ip_address__in=['127.0.0.1', 'localhost']
            ).order_by('-detected_at')[:5]
            
            if not recent_activities.exists():
                return anomalies
            
            # Simple geographic check (would need GeoIP database for full implementation)
            # For now, check for rapid IP changes
            unique_ips = set()
            for activity in recent_activities:
                if activity.ip_address:
                    unique_ips.add(activity.ip_address)
            
            if len(unique_ips) > 3:  # Multiple IPs in 24 hours
                anomalies.append({
                    'type': 'geographic',
                    'indicator': 'multiple_ip_addresses',
                    'score': min(1.0, len(unique_ips) / 5),
                    'details': f'Used {len(unique_ips)} different IP addresses in 24 hours',
                    'severity': 'MEDIUM'
                })
            
            # Check for impossible travel (simplified)
            if len(recent_activities) >= 2:
                latest_activity = recent_activities.first()
                previous_activity = recent_activities[1]
                
                time_diff = (latest_activity.detected_at - previous_activity.detected_at).total_seconds() / 3600
                
                # If activities from different IPs within short time (simplified check)
                if (latest_activity.ip_address != previous_activity.ip_address and 
                    time_diff < 1):  # Same IP different within 1 hour might be suspicious
                    
                    anomalies.append({
                        'type': 'geographic',
                        'indicator': 'rapid_location_change',
                        'score': max(0.5, 1.0 - time_diff),
                        'details': f'IP change within {time_diff:.1f} hours',
                        'severity': 'MEDIUM'
                    })
            
        except Exception as e:
            logger.error(f"Error checking geographic anomalies: {e}")
        
        return anomalies

    def _check_timing_anomalies(self, user, activity_data):
        """Check for timing pattern anomalies."""
        anomalies = []
        
        try:
            current_time = activity_data.get('timestamp', now())
            if isinstance(current_time, str):
                current_time = datetime.fromisoformat(current_time.replace('Z', '+00:00'))
            
            current_hour = current_time.hour
            
            # Get user's typical activity hours
            historical_activities = SuspiciousActivity.objects.filter(
                user=user,
                detected_at__gte=now() - timedelta(days=30)
            )
            
            if historical_activities.count() < 5:
                return anomalies  # Not enough data
            
            # Calculate typical activity hours
            activity_hours = [activity.detected_at.hour for activity in historical_activities]
            
            if activity_hours:
                mean_hour = np.mean(activity_hours)
                std_hour = np.std(activity_hours)
                
                # Calculate z-score for current hour
                z_score = abs(current_hour - mean_hour) / max(std_hour, 1)
                
                if z_score > self.anomaly_rules['timing_anomaly_threshold']:
                    anomalies.append({
                        'type': 'timing',
                        'indicator': 'unusual_activity_time',
                        'score': min(1.0, z_score / 4),
                        'details': f'Activity at unusual time: {current_hour:02d}:00 (typical: {mean_hour:.1f}±{std_hour:.1f})',
                        'severity': 'LOW' if z_score < 3 else 'MEDIUM'
                    })
            
            # Check for weekend/holiday activity (simplified)
            if current_time.weekday() >= 5:  # Weekend
                weekend_activities = historical_activities.filter(
                    detected_at__week_day__in=[1, 7]  # Sunday=1, Saturday=7
                ).count()
                
                total_activities = historical_activities.count()
                weekend_ratio = weekend_activities / max(total_activities, 1)
                
                if weekend_ratio < 0.1:  # User rarely active on weekends
                    anomalies.append({
                        'type': 'timing',
                        'indicator': 'unusual_weekend_activity',
                        'score': 0.6,
                        'details': f'Weekend activity (user typically inactive on weekends)',
                        'severity': 'LOW'
                    })
            
        except Exception as e:
            logger.error(f"Error checking timing anomalies: {e}")
        
        return anomalies

    def _check_session_anomalies(self, user, activity_data):
        """Check for session-related anomalies."""
        anomalies = []
        
        try:
            # Check for concurrent sessions (simplified - would need session tracking)
            recent_activities = SuspiciousActivity.objects.filter(
                user=user,
                detected_at__gte=now() - timedelta(minutes=self.anomaly_rules['session_timeout_minutes'])
            )
            
            # Count unique IP addresses as proxy for concurrent sessions
            unique_ips = set()
            for activity in recent_activities:
                if activity.ip_address and activity.ip_address != '127.0.0.1':
                    unique_ips.add(activity.ip_address)
            
            if len(unique_ips) > self.anomaly_rules['max_concurrent_sessions']:
                anomalies.append({
                    'type': 'session',
                    'indicator': 'multiple_concurrent_sessions',
                    'score': min(1.0, len(unique_ips) / (self.anomaly_rules['max_concurrent_sessions'] * 2)),
                    'details': f'Apparent concurrent sessions from {len(unique_ips)} different IPs',
                    'severity': 'MEDIUM'
                })
            
            # Check for rapid successive activities (potential automation)
            if recent_activities.count() >= 10:
                time_intervals = []
                activities_list = list(recent_activities.order_by('detected_at'))
                
                for i in range(1, len(activities_list)):
                    interval = (activities_list[i].detected_at - activities_list[i-1].detected_at).total_seconds()
                    time_intervals.append(interval)
                
                if time_intervals:
                    avg_interval = np.mean(time_intervals)
                    if avg_interval < 5:  # Less than 5 seconds between activities
                        anomalies.append({
                            'type': 'session',
                            'indicator': 'rapid_successive_activities',
                            'score': max(0.5, 1.0 - (avg_interval / 10)),
                            'details': f'Very rapid activity pattern (avg {avg_interval:.1f}s intervals)',
                            'severity': 'HIGH' if avg_interval < 2 else 'MEDIUM'
                        })
            
        except Exception as e:
            logger.error(f"Error checking session anomalies: {e}")
        
        return anomalies

    def update_detection_rules(self, new_rules):
        """Update anomaly detection rules dynamically."""
        try:
            self.anomaly_rules.update(new_rules)
            logger.info(f"Updated anomaly detection rules: {new_rules}")
        except Exception as e:
            logger.error(f"Error updating detection rules: {e}")

    def get_user_risk_score(self, user):
        """Calculate overall risk score for a user based on recent activities."""
        try:
            recent_activities = SuspiciousActivity.objects.filter(
                user=user,
                detected_at__gte=now() - timedelta(days=7)
            )
            
            if not recent_activities.exists():
                return 0.1  # Low risk for inactive users
            
            # Calculate average confidence of suspicious activities
            confidence_scores = [activity.confidence for activity in recent_activities]
            avg_confidence = np.mean(confidence_scores)
            
            # Factor in frequency of suspicious activities
            activity_frequency = recent_activities.count() / 7  # per day
            frequency_factor = min(1.0, activity_frequency / 5)  # 5+ activities per day = max impact
            
            # Combine confidence and frequency
            risk_score = (avg_confidence * 0.7) + (frequency_factor * 0.3)
            
            return min(1.0, risk_score)
            
        except Exception as e:
            logger.error(f"Error calculating user risk score: {e}")
            return 0.5