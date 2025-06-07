from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from api.docs.decorators import uuid_path_param
from api.docs.config import ERROR_RESPONSES
from applications.serializers import (
    CreditApplicationSerializer,
    ApplicationSubmitSerializer,
    DocumentSerializer,
    ApplicationNoteSerializer
)

# --- ApplicationListView ---

list_applications_docs = extend_schema(
    summary="List Applications",
    description="Retrieve all credit applications visible to the current user. "
                "Regular users see only their own applications. Admins and analysts see all applications.",
    parameters=[
        OpenApiParameter(
            name='status',
            type=str,
            location=OpenApiParameter.QUERY,
            description='Filter by application status',
            enum=['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']
        ),
        OpenApiParameter(
            name='ordering',
            type=str,
            location=OpenApiParameter.QUERY,
            description='Sort results (prefix with - for descending)',
            enum=['created_at', '-created_at', 'status', '-status']
        )
    ],
    responses={200: CreditApplicationSerializer(many=True), **ERROR_RESPONSES},
    tags=["Applications"]
)


create_application_docs = extend_schema(
    summary="Create Application",
    description="""
    Create a new credit application in DRAFT status.
    The application can include full applicant details including:
    - Personal information
    - Address history
    - Employment history
    - Financial information
    """,
    request=CreditApplicationSerializer,
    responses={201: CreditApplicationSerializer, **ERROR_RESPONSES},
    tags=["Applications"]
)


# --- ApplicationDetailView ---

retrieve_application_docs = extend_schema(
    summary="Retrieve Application",
    description="Get full details of a specific credit application.",
    parameters=[uuid_path_param('pk', 'Application UUID')],
    responses={200: CreditApplicationSerializer, **ERROR_RESPONSES},
    tags=["Applications"]
)

update_application_docs = extend_schema(
    summary="Update Application",
    description="""
    Update an existing credit application.
    Only applications in DRAFT status can be modified.
    """,
    parameters=[uuid_path_param('pk', 'Application UUID')],
    request=CreditApplicationSerializer,
    responses={200: CreditApplicationSerializer, **ERROR_RESPONSES},
    tags=["Applications"]
)

partial_update_application_docs = extend_schema(
    summary="Partial Update Application",
    description="""
    Partially update an existing credit application.
    Only applications in DRAFT status can be modified.
    """,
    parameters=[uuid_path_param('pk', 'Application UUID')],
    request=CreditApplicationSerializer,
    responses={200: CreditApplicationSerializer, **ERROR_RESPONSES},
    tags=["Applications"]
)


delete_application_docs = extend_schema(
    summary="Delete Application",
    description="""
    Delete a credit application.
    Only applications in DRAFT status can be deleted.
    """,
    parameters=[uuid_path_param('pk', 'Application UUID')],
    responses={204: OpenApiResponse(description="Application deleted"), **ERROR_RESPONSES},
    tags=["Applications"]
)

# --- ApplicationSubmitView ---

submit_application_docs = extend_schema(
    summary="Submit Application",
    description="""
    Submit a DRAFT application for processing.
    This action:
    1. Changes status to SUBMITTED
    2. Generates a reference number
    3. Triggers automatic risk assessment
    """,
    parameters=[uuid_path_param('pk', 'Application UUID')],
    request=ApplicationSubmitSerializer,
    responses={
        200: {
            'description': 'Application submitted successfully',
            'content': {
                'application/json': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'status': {'type': 'string'},
                            'risk_assessment_id': {
                                'type': 'string',
                                'format': 'uuid',
                                'description': 'ID of the generated risk assessment'
                            }
                        },
                        'example': {
                            'status': 'Application submitted successfully',
                            'risk_assessment_id': '3fa85f64-5717-4562-b3fc-2c963f66afa6'
                        }
                    }
                }
            }
        },
        **ERROR_RESPONSES
    },
    tags=["Applications"]
)



# --- DocumentListView ---

document_list_docs = extend_schema(
    summary="List Application Documents",
    description="Retrieve all documents attached to a specific application.",
    parameters=[uuid_path_param('pk', 'Application UUID')],
    responses={200: DocumentSerializer(many=True), **ERROR_RESPONSES},
    tags=["Applications"]
)

document_upload_docs = extend_schema(
    summary="Upload Document",
    description="""
    Upload a document to an application.
    Supported file types: PDF, JPG, PNG (max 10MB)
    """,
    parameters=[uuid_path_param('pk', 'Application UUID')],
    request={
        'multipart/form-data': {
            'type': 'object',
            'properties': {
                'file': {
                    'type': 'string',
                    'format': 'binary'
                },
                'document_type': {
                    'type': 'string',
                    'enum': ['IDENTIFICATION', 'PROOF_OF_INCOME', 'BANK_STATEMENT', 'TAX_RETURN', 'OTHER']
                },
                'description': {
                    'type': 'string',
                    'maxLength': 255
                }
            }
        }
    },
    responses={
        201: DocumentSerializer,
        **ERROR_RESPONSES
    },
    tags=["Applications"]
)

# --- DocumentDetailView ---

document_retrieve_docs = extend_schema(
    summary="Get Document",
    description="Retrieve details of a specific application document",
    parameters=[
        uuid_path_param('pk', 'Application UUID'),
        uuid_path_param('doc_pk', 'Document UUID')
    ],
    responses={
        200: DocumentSerializer,
        **ERROR_RESPONSES
    },
    tags=["Applications"]
)

document_update_docs = extend_schema(
    summary="Update Document",
    description="Update document metadata (document file cannot be changed)",
    parameters=[
        uuid_path_param('pk', 'Application UUID'),
        uuid_path_param('doc_pk', 'Document UUID')
    ],
    responses={
        200: DocumentSerializer,
        **ERROR_RESPONSES
    },
    tags=["Applications"]
)

document_delete_docs = extend_schema(
    summary="Delete Document",
    description="Remove a document from an application",
    parameters=[
        uuid_path_param('pk', 'Application UUID'),
        uuid_path_param('doc_pk', 'Document UUID')
    ],
    responses={
        204: OpenApiResponse(description='Document deleted'),
        **ERROR_RESPONSES
    },
    tags=["Applications"]
)

# --- ApplicationNoteListView ---

note_list_docs = extend_schema(
    summary="List Application Notes",
    description="Get all notes/comments attached to a specific application",
    parameters=[uuid_path_param('pk', 'Application UUID')],
    responses={
        200: ApplicationNoteSerializer(many=True),
        **ERROR_RESPONSES
    },
    tags=["Applications"]
)

note_create_docs = extend_schema(
    summary="Add Application Note",
    description="Add a new note/comment to a specifcic application",
    parameters=[uuid_path_param('pk', 'Application UUID')],
    request=ApplicationNoteSerializer,
    responses={
        201: ApplicationNoteSerializer,
        **ERROR_RESPONSES
    }, 
    tags=["Applications"]
)

