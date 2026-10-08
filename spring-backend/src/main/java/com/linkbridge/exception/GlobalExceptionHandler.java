package com.linkbridge.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private String generateReferenceId() {
        return "LP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(AccessDeniedException e) {
        return buildErrorResponse(HttpStatus.FORBIDDEN, "PERMISSION_DENIED", 
            e.getMessage() != null ? e.getMessage() : "You do not have permission to perform this action.");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<?> handleAuthException(AuthenticationException e) {
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED", 
            "Authentication required. Please sign in to continue.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException e) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", 
            e.getMessage() != null ? e.getMessage() : "Invalid request parameters.");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDataIntegrity(DataIntegrityViolationException e) {
        String refId = generateReferenceId();
        log.warn("[Database Conflict] Ref {}: {}", refId, e.getMessage());
        return buildErrorResponseWithRef(HttpStatus.CONFLICT, "RESOURCE_CONFLICT", 
            "A resource with these details already exists or conflicts with existing records.", refId);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationErrors(MethodArgumentNotValidException ex) {
        String refId = generateReferenceId();
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("errorCode", "VALIDATION_FAILED");
        body.put("message", "Validation failed for one or more fields.");
        body.put("referenceId", refId);
        body.put("fieldErrors", fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<?> handleMaxSize(MaxUploadSizeExceededException e) {
        return buildErrorResponse(HttpStatus.PAYLOAD_TOO_LARGE, "PAYLOAD_TOO_LARGE", 
            "Uploaded file exceeds the maximum allowed size limit.");
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> handleResponseStatus(ResponseStatusException e) {
        HttpStatus status = HttpStatus.valueOf(e.getStatusCode().value());
        String code = status == HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" :
                      status == HttpStatus.TOO_MANY_REQUESTS ? "RATE_LIMIT_EXCEEDED" : "REQUEST_FAILED";
        return buildErrorResponse(status, code, e.getReason() != null ? e.getReason() : "Request could not be processed.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneric(Exception e) {
        String refId = generateReferenceId();
        // Log internally without leaking stack traces, SQL, or internals to the client
        log.error("[System Error] Ref {}: {}", refId, e.getMessage(), e);
        return buildErrorResponseWithRef(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", 
            "An unexpected server error occurred. Please contact support quoting reference: " + refId, refId);
    }

    private ResponseEntity<Map<String, Object>> buildErrorResponse(HttpStatus status, String errorCode, String message) {
        return buildErrorResponseWithRef(status, errorCode, message, generateReferenceId());
    }

    private ResponseEntity<Map<String, Object>> buildErrorResponseWithRef(HttpStatus status, String errorCode, String message, String referenceId) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("errorCode", errorCode);
        body.put("message", message);
        body.put("error", message); // backward compatibility with older clients expecting 'error' key
        body.put("referenceId", referenceId);
        return ResponseEntity.status(status).body(body);
    }
}
