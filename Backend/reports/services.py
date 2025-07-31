import pandas as pd
import io
import json
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Count, Avg, Sum, Q
from django.template.loader import render_to_string
from django.conf import settings
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from django.db.models import Count, Avg, Sum, Q, Min, Max
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart
import xlsxwriter
from celery import shared_task

from .models import Report
from applications.models import CreditApplication, Applicant
from risk.models import RiskAssessment, Decision
from users.models import User


class ReportGenerationService:
    """
    Service for generating different types of reports
    """
    
    def __init__(self):
        self.report_generators = {
            'RISK_SUMMARY': self.generate_risk_summary,
            'APPLICATION_ANALYTICS': self.generate_application_analytics,
            'PERFORMANCE_METRICS': self.generate_performance_metrics,
            'COMPLIANCE_AUDIT': self.generate_compliance_audit,
            'FINANCIAL_OVERVIEW': self.generate_financial_overview,
            'MONTHLY_SUMMARY': self.generate_monthly_summary,
            'QUARTERLY_REPORT': self.generate_quarterly_report,
        }
    
    def generate_report_async(self, report_id):
        """
        Trigger async report generation
        """
        generate_report_task.delay(report_id)
    
    def generate_report(self, report_id):
        """
        Generate report synchronously
        """
        try:
            report = Report.objects.get(id=report_id)
            report.status = 'GENERATING'
            report.save()
            
            generator = self.report_generators.get(report.report_type)
            if not generator:
                raise ValueError(f"No generator for report type: {report.report_type}")
            
            # Generate report data
            report_data = generator(report)
            
            # Save generated data
            report.data = report_data
            report.status = 'COMPLETED'
            report.generated_at = timezone.now()
            
            # Set expiration (30 days from generation)
            report.expires_at = timezone.now() + timedelta(days=30)
            
            report.save()
            
            return report
            
        except Exception as e:
            report.status = 'FAILED'
            report.save()
            raise e
    
    def generate_risk_summary(self, report):
        """Generate risk assessment summary report"""
        filters = report.filters or {}
        
        # Date range
        date_from = report.date_from or timezone.now() - timedelta(days=30)
        date_to = report.date_to or timezone.now()
        
        # Get risk assessments
        assessments = RiskAssessment.objects.filter(
            last_updated__range=[date_from, date_to]
        )
        
        # Apply additional filters
        if filters.get('risk_rating'):
            assessments = assessments.filter(risk_rating=filters['risk_rating'])
        
        # Calculate metrics
        total_assessments = assessments.count()
        avg_risk_score = assessments.aggregate(avg=Avg('risk_score'))['avg'] or 0
        
        # Risk distribution
        risk_distribution = {}
        for rating in ['Very Low', 'Low', 'Moderate', 'High', 'Very High']:
            count = assessments.filter(risk_rating=rating).count()
            risk_distribution[rating] = {
                'count': count,
                'percentage': (count / total_assessments * 100) if total_assessments > 0 else 0
            }
        
        # Trend data (last 6 months)
        trend_data = []
        for i in range(6):
            month_start = timezone.now() - timedelta(days=i*30)
            month_end = month_start + timedelta(days=30)
            month_assessments = RiskAssessment.objects.filter(
                last_updated__range=[month_start, month_end]
            )
            trend_data.append({
                'month': month_start.strftime('%Y-%m'),
                'count': month_assessments.count(),
                'avg_score': month_assessments.aggregate(avg=Avg('risk_score'))['avg'] or 0
            })
        
        return {
            'summary': {
                'total_assessments': total_assessments,
                'avg_risk_score': round(avg_risk_score, 2),
                'date_range': {
                    'from': date_from.isoformat(),
                    'to': date_to.isoformat()
                }
            },
            'risk_distribution': risk_distribution,
            'trend_data': trend_data,
            'generated_at': timezone.now().isoformat()
        }
    
    def generate_application_analytics(self, report):
        """Generate application analytics report"""
        filters = report.filters or {}
        
        # Date range
        date_from = report.date_from or timezone.now() - timedelta(days=30)
        date_to = report.date_to or timezone.now()
        
        # Get applications
        applications = CreditApplication.objects.filter(
            created_at__range=[date_from, date_to]
        )
        
        # Apply filters
        if filters.get('status'):
            applications = applications.filter(status=filters['status'])
        if filters.get('loan_type'):
            applications = applications.filter(loan_type=filters['loan_type'])
        
        # Basic metrics
        total_applications = applications.count()
        approved_count = applications.filter(status='APPROVED').count()
        denied_count = applications.filter(status='REJECTED').count()
        pending_count = applications.filter(status='PENDING').count()
        
        approval_rate = (approved_count / total_applications * 100) if total_applications > 0 else 0
        
        # Applications by status
        status_distribution = dict(
            applications.values('status').annotate(count=Count('id')).values_list('status', 'count')
        )
        
        # Applications by loan type
        loan_type_distribution = dict(
            applications.values('loan_type').annotate(count=Count('id')).values_list('loan_type', 'count')
        )
        
        # Amount statistics
        amount_stats = applications.aggregate(
            total_amount=Sum('loan_amount'),
            avg_amount=Avg('loan_amount'),
            min_amount=Min('loan_amount'),
            max_amount=Max('loan_amount')
        )
        
        return {
            'summary': {
                'total_applications': total_applications,
                'approved_count': approved_count,
                'denied_count': denied_count,
                'pending_count': pending_count,
                'approval_rate': round(approval_rate, 2),
                'date_range': {
                    'from': date_from.isoformat(),
                    'to': date_to.isoformat()
                }
            },
            'distributions': {
                'status': status_distribution,
                'loan_type': loan_type_distribution
            },
            'amount_statistics': {
                'total_amount': float(amount_stats['total_amount'] or 0),
                'avg_amount': float(amount_stats['avg_amount'] or 0),
                'min_amount': float(amount_stats['min_amount'] or 0),
                'max_amount': float(amount_stats['max_amount'] or 0)
            },
            'generated_at': timezone.now().isoformat()
        }
    
    def generate_performance_metrics(self, report):
        """Generate performance metrics report"""
        # Placeholder for performance metrics
        # This would include processing times, system performance, etc.
        return {
            'summary': {
                'avg_processing_time': '2.3 hours',
                'system_uptime': '99.8%',
                'error_rate': '0.2%'
            },
            'metrics': [
                {'name': 'Application Processing Time', 'value': '2.3', 'unit': 'hours'},
                {'name': 'Risk Assessment Accuracy', 'value': '94.5', 'unit': '%'},
                {'name': 'User Satisfaction', 'value': '4.7', 'unit': '/5'},
            ],
            'generated_at': timezone.now().isoformat()
        }
    
    def generate_compliance_audit(self, report):
        """Generate compliance audit report"""
        # Placeholder for compliance audit
        return {
            'summary': {
                'compliance_score': '98.5%',
                'issues_found': 3,
                'recommendations': 8
            },
            'audit_results': [
                {'category': 'Data Protection', 'score': 100, 'status': 'Compliant'},
                {'category': 'Risk Management', 'score': 95, 'status': 'Minor Issues'},
                {'category': 'Documentation', 'score': 100, 'status': 'Compliant'},
            ],
            'generated_at': timezone.now().isoformat()
        }
    
    def generate_financial_overview(self, report):
        """Generate financial overview report"""
        # Placeholder for financial overview
        return {
            'summary': {
                'total_loan_volume': 2500000.00,
                'avg_loan_amount': 50000.00,
                'portfolio_value': 5000000.00
            },
            'metrics': [
                {'name': 'Total Loan Volume', 'value': 2500000.00, 'currency': 'USD'},
                {'name': 'Active Loans', 'value': 150, 'unit': 'loans'},
                {'name': 'Default Rate', 'value': 2.1, 'unit': '%'},
            ],
            'generated_at': timezone.now().isoformat()
        }
    
    def generate_monthly_summary(self, report):
        """Generate monthly summary report"""
        # Combine multiple report types for monthly summary
        risk_data = self.generate_risk_summary(report)
        app_data = self.generate_application_analytics(report)
        
        return {
            'summary': {
                'period': 'Monthly',
                'total_applications': app_data['summary']['total_applications'],
                'total_assessments': risk_data['summary']['total_assessments'],
                'approval_rate': app_data['summary']['approval_rate'],
                'avg_risk_score': risk_data['summary']['avg_risk_score']
            },
            'risk_summary': risk_data,
            'application_summary': app_data,
            'generated_at': timezone.now().isoformat()
        }
    
    def generate_quarterly_report(self, report):
        """Generate quarterly report"""
        # Similar to monthly but with quarterly data
        return self.generate_monthly_summary(report)


class ReportExportService:
    """
    Service for exporting reports in different formats
    """
    
    def export_report(self, report, format_type):
        """
        Export report in specified format
        """
        if format_type == 'pdf':
            return self.export_pdf(report)
        elif format_type == 'excel':
            return self.export_excel(report)
        elif format_type == 'csv':
            return self.export_csv(report)
        else:
            raise ValueError(f"Unsupported export format: {format_type}")
    
    def export_pdf(self, report):
        """Export report as PDF"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.HexColor('#1f2937')
        )
        
        # Build PDF content
        content = []
        
        # Title
        content.append(Paragraph(report.title, title_style))
        content.append(Spacer(1, 12))
        
        # Description
        if report.description:
            content.append(Paragraph(report.description, styles['Normal']))
            content.append(Spacer(1, 12))
        
        # Report data
        if report.data:
            self._add_data_to_pdf(content, report.data, styles)
        
        # Build PDF
        doc.build(content)
        buffer.seek(0)
        
        filename = f"{report.title}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        return buffer.getvalue(), 'application/pdf', filename
    
    def export_excel(self, report):
        """Export report as Excel"""
        buffer = io.BytesIO()
        
        with pd.ExcelWriter(buffer, engine='xlsxwriter') as writer:
            workbook = writer.book
            
            # Create summary worksheet
            summary_data = {
                'Report Title': [report.title],
                'Report Type': [report.get_report_type_display()],
                'Generated At': [report.generated_at or timezone.now()],
                'Created By': [report.created_by.get_full_name()],
            }
            
            df_summary = pd.DataFrame(summary_data)
            df_summary.to_excel(writer, sheet_name='Summary', index=False)
            
            # Add data sheets
            if report.data:
                self._add_data_to_excel(writer, report.data)
        
        buffer.seek(0)
        filename = f"{report.title}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        return buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename
    
    def export_csv(self, report):
        """Export report as CSV"""
        buffer = io.StringIO()
        
        # Write header
        buffer.write(f"Report: {report.title}\n")
        buffer.write(f"Type: {report.get_report_type_display()}\n")
        buffer.write(f"Generated: {report.generated_at or timezone.now()}\n")
        buffer.write(f"Created By: {report.created_by.get_full_name()}\n\n")
        
        # Write data
        if report.data:
            self._add_data_to_csv(buffer, report.data)
        
        filename = f"{report.title}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.csv"
        return buffer.getvalue().encode('utf-8'), 'text/csv', filename
    
    def _add_data_to_pdf(self, content, data, styles):
        """Add report data to PDF content"""
        if 'summary' in data:
            content.append(Paragraph('Summary', styles['Heading2']))
            for key, value in data['summary'].items():
                content.append(Paragraph(f"{key}: {value}", styles['Normal']))
            content.append(Spacer(1, 12))
    
    def _add_data_to_excel(self, writer, data):
        """Add report data to Excel worksheets"""
        if 'summary' in data:
            df = pd.DataFrame.from_dict(data['summary'], orient='index', columns=['Value'])
            df.to_excel(writer, sheet_name='Summary_Data')
        
        for key, value in data.items():
            if key != 'summary' and isinstance(value, dict):
                try:
                    df = pd.DataFrame.from_dict(value, orient='index')
                    df.to_excel(writer, sheet_name=key[:31])
                except:
                    pass
    
    def _add_data_to_csv(self, buffer, data):
        """Add report data to CSV"""
        if 'summary' in data:
            buffer.write("Summary\n")
            for key, value in data['summary'].items():
                buffer.write(f"{key},{value}\n")
            buffer.write("\n")


@shared_task
def generate_report_task(report_id):
    """
    Celery task for async report generation
    """
    service = ReportGenerationService()
    return service.generate_report(report_id)