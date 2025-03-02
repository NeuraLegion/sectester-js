export enum TestType {
  /** Detects unclaimed AWS S3 buckets vulnerable to takeover */
  AMAZON_S3_TAKEOVER = 'amazon_s3_takeover',
  /** Tests for bypassing fine-grained authorization controls on object attributes through property manipulation techniques */
  BROKEN_OBJECT_PROPERTY_LEVEL_AUTHORIZATION = 'bopla',
  /** Identifies SAML authentication misconfigurations allowing bypass */
  BROKEN_SAML_AUTHENTICATION = 'broken_saml_auth',
  /** Tests JWT implementation weaknesses allowing forged token acceptance */
  BROKEN_JWT_AUTHENTICATION = 'jwt',
  /** Tests vulnerability to credential stuffing and password guessing */
  BRUTE_FORCE_LOGIN = 'brute_force_login',
  /** Checks for manipulation of item quantities to bypass business logic */
  BUSINESS_CONSTRAINT_BYPASS = 'business_constraint_bypass',
  /** Verifies cookie security settings and session ID strength */
  COOKIE_SECURITY = 'cookie_security',
  /** Tests for the absence or failure of CSRF protection mechanisms across forms and API endpoints */
  CROSS_SITE_REQUEST_FORGERY = 'csrf',
  /** Tests for injection of malicious CSS code */
  CSS_INJECTION = 'css_injection',
  /** Tests for improper handling of date/time inputs that attackers could manipulate to bypass time-based validations */
  DATE_MANIPULATION = 'date_manipulation',
  /** Checks for email header/content injection vulnerabilities */
  EMAIL_INJECTION = 'email_injection',
  /** Identifies APIs exposing excessive data beyond intended access */
  EXCESSIVE_DATA_EXPOSURE = 'excessive_data_exposure',
  /** Tests for insecure file upload handling and validation */
  FILE_UPLOAD = 'file_upload',
  /** Checks for exposure of server file paths in errors */
  FULL_PATH_DISCLOSURE = 'full_path_disclosure',
  /** Checks if GraphQL schema can be discovered through introspection */
  GRAPHQL_INTROSPECTION = 'graphql_introspection',
  /** Tests for unsanitized input allowing HTML content manipulation */
  HTML_INJECTION = 'html_injection',
  /** Checks for dangerous HTTP methods enabled on the server */
  HTTP_METHOD_FUZZING = 'http_method_fuzzing',
  /** Tests for API endpoints vulnerable to object ID enumeration */
  ID_ENUMERATION = 'id_enumeration',
  /** Tests for vulnerabilities that allow the injection of malicious iframes */
  IFRAME_INJECTION = 'iframe_injection',
  /** Identifies outdated and potentially vulnerable API versions */
  IMPROPER_ASSET_MANAGEMENT = 'improper_asset_management',
  /** Tests sanitization of AI/LLM outputs to prevent vulnerabilities */
  INSECURE_OUTPUT_HANDLING = 'insecure_output_handling',
  /** Tests for injection vulnerabilities in LDAP queries */
  LDAP_INJECTION = 'ldapi',
  /** Tests for vulnerabilities allowing access to server files */
  LOCAL_FILE_INCLUSION = 'lfi',
  /** Tests for unvalidated property assignment in API objects */
  MASS_ASSIGNMENT = 'mass_assignment',
  /** Tests for injection vulnerabilities in MongoDB query handling */
  MONGODB_INJECTION = 'nosql',
  /** Identifies publicly accessible cloud storage buckets */
  OPEN_CLOUD_STORAGE = 'open_cloud_storage',
  /** Detects exposed database connection strings */
  EXPOSED_DATABASE_DETAILS = 'open_database',
  /** Tests for vulnerabilities allowing server command execution */
  OS_COMMAND_INJECTION = 'osi',
  /** Tests for vulnerabilities in password reset workflows—such as token interception, reuse, or manipulation */
  PASSWORD_RESET_POISONING = 'password_reset_poisoning',
  /** Tests if AI models are vulnerable to input manipulation */
  PROMPT_INJECTION = 'prompt_injection',
  /** Tests prevention of JavaScript prototype chain manipulation */
  JS_PROTOTYPE_POLLUTION = 'proto_pollution',
  /** Tests for insecure inclusion of remote files */
  REMOTE_FILE_INCLUSION = 'rfi',
  /** Tests for database query injection vulnerabilities */
  SQL_INJECTION = 'sqli',
  /** Identifies credentials and tokens in source code */
  SECRET_TOKENS_LEAK = 'secret_tokens',
  /** Tests for vulnerabilities where user input executes as server-side code */
  SERVER_SIDE_JS_INJECTION = 'server_side_js_injection',
  /** Tests if user input can influence requests to internal resources */
  SERVER_SIDE_REQUEST_FORGERY = 'ssrf',
  /** Tests for template engine code injection vulnerabilities */
  SERVER_SIDE_TEMPLATE_INJECTION = 'ssti',
  /** Tests for injected scripts that persist across sessions */
  STORED_CROSS_SITE_SCRIPTING = 'stored_xss',
  /** Tests for manipulated redirects to malicious sites */
  UNVALIDATED_REDIRECT = 'unvalidated_redirect',
  /** Tests for XML query injection vulnerabilities */
  XPATH_INJECTION = 'xpathi',
  /** Tests for XML parsing flaws allowing server file access */
  XML_EXTERNAL_ENTITY_INJECTION = 'xxe',
  /** Tests for client-side script injection vulnerabilities */
  CROSS_SITE_SCRIPTING = 'xss'
}
