from rest_framework import serializers
from .models import (
    CreditApplication, 
    Applicant, 
    Address, 
    EmploymentInfo, 
    FinancialInfo, 
    BankAccount,
    Document,
    ApplicationNote
)
import uuid

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'
        extra_kwargs = {
            'applicant': {'required': False}
        }

class EmploymentInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmploymentInfo
        fields = '__all__'
        extra_kwargs = {
            'applicant': {'required': False}
        }

class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = '__all__'
        extra_kwargs = {
            'financial_info': {'required': False}
        }

class FinancialInfoSerializer(serializers.ModelSerializer):
    bank_accounts = BankAccountSerializer(many=True, required=False)
    
    class Meta:
        model = FinancialInfo
        fields = '__all__'
        extra_kwargs = {
            'applicant': {'required': False}
        }

    def create(self, validated_data):
        bank_accounts_data = validated_data.pop('bank_accounts', [])
        financial_info = FinancialInfo.objects.create(**validated_data)
        
        for account_data in bank_accounts_data:
            BankAccount.objects.create(financial_info=financial_info, **account_data)
            
        return financial_info

class ApplicantSerializer(serializers.ModelSerializer):
    addresses = AddressSerializer(many=True, required=False)
    employment_history = EmploymentInfoSerializer(many=True, required=False)
    financial_info = FinancialInfoSerializer(required=False)
    
    class Meta:
        model = Applicant
        fields = '__all__'
        extra_kwargs = {
            'application': {'required': False}
        }

    def create(self, validated_data):
        addresses_data = validated_data.pop('addresses', [])
        employment_data = validated_data.pop('employment_history', [])
        financial_data = validated_data.pop('financial_info', None)
        
        applicant = Applicant.objects.create(**validated_data)
        
        for address_data in addresses_data:
            Address.objects.create(applicant=applicant, **address_data)
            
        for employment_data in employment_data:
            EmploymentInfo.objects.create(applicant=applicant, **employment_data)
            
        if financial_data:
            bank_accounts_data = financial_data.pop('bank_accounts', [])
            financial_info = FinancialInfo.objects.create(applicant=applicant, **financial_data)
            
            for account_data in bank_accounts_data:
                BankAccount.objects.create(financial_info=financial_info, **account_data)
                
        return applicant

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = '__all__'
        extra_kwargs = {
            'application': {'required': False},
            'verified': {'read_only': True},
            'verification_notes': {'read_only': True}
        }

class ApplicationNoteSerializer(serializers.ModelSerializer):
    author_email = serializers.EmailField(source='author.email', read_only=True)
    
    class Meta:
        model = ApplicationNote
        fields = '__all__'
        read_only_fields = ['author', 'created_at']

class CreditApplicationSerializer(serializers.ModelSerializer):
    applicant_info = ApplicantSerializer(required=False)
    documents = DocumentSerializer(many=True, read_only=True)  
    additional_notes = ApplicationNoteSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = CreditApplication
        fields = '__all__'
        read_only_fields = ['reference_number', 'submission_date', 'assigned_analyst']
        
    def create(self, validated_data):
        applicant_data = validated_data.pop('applicant_info', None)
        application = CreditApplication.objects.create(**validated_data)
        
        if applicant_data:
            applicant_serializer = ApplicantSerializer(data=applicant_data)
            if applicant_serializer.is_valid():
                applicant_serializer.save(application=application)
                
        return application

class ApplicationSubmitSerializer(serializers.Serializer):
    confirm = serializers.BooleanField(required=True, write_only=True)
    
    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError("You must confirm submission")
        return value