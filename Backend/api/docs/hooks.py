def custom_postprocessing_hook(result, generator, request, public):
    """
    Custom processing of the schema for consistency
    """
    # Ensure all paths start with /api/
    for path in list(result['paths'].keys()):
        if not path.startswith('/api/'):
            new_path = f'/api{path}'
            result['paths'][new_path] = result['paths'].pop(path)
    
    # Add common parameters
    for path, methods in result['paths'].items():
        for method, operation in methods.items():
            # Add common parameters
            operation.setdefault('parameters', []).extend([
                {
                    'name': 'X-Client-Version',
                    'in': 'header',
                    'required': False,
                    'schema': {'type': 'string'},
                    'description': 'Client application version'
                },
                {
                    'name': 'Accept-Language',
                    'in': 'header',
                    'required': False,
                    'schema': {'type': 'string', 'default': 'en'},
                    'description': 'Language preference'
                }
            ])
    
    return result