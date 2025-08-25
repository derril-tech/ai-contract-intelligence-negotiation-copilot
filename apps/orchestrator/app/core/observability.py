# Created automatically by Cursor AI (2024-12-19)

import os
import time
import functools
from typing import Dict, Any, Optional
from contextlib import contextmanager

import structlog
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.celery import CeleryInstrumentor

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Request, Response
from fastapi.responses import PlainTextResponse

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)

# Prometheus metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

ACTIVE_REQUESTS = Gauge(
    'http_active_requests',
    'Number of active HTTP requests',
    ['method', 'endpoint']
)

CELERY_TASK_COUNT = Counter(
    'celery_tasks_total',
    'Total Celery tasks',
    ['task_name', 'status']
)

CELERY_TASK_DURATION = Histogram(
    'celery_task_duration_seconds',
    'Celery task duration in seconds',
    ['task_name']
)

REDLINE_LATENCY = Histogram(
    'redline_latency_seconds',
    'Redline generation latency in seconds',
    ['agreement_id']
)

RISK_REPORT_LATENCY = Histogram(
    'risk_report_latency_seconds',
    'Risk report generation latency in seconds',
    ['agreement_id']
)

APPROVAL_SLA_BREACHES = Counter(
    'approval_sla_breaches_total',
    'Total approval SLA breaches',
    ['gate_id', 'org_id']
)

SIGNATURE_WEBHOOK_LAG = Histogram(
    'signature_webhook_lag_seconds',
    'Signature webhook processing lag in seconds',
    ['envelope_id']
)

class ObservabilityManager:
    """Manages observability across the application"""
    
    def __init__(self):
        self.tracer = None
        self.sentry_initialized = False
        self._setup_tracing()
        self._setup_sentry()
        self._setup_instrumentation()
    
    def _setup_tracing(self):
        """Setup OpenTelemetry tracing"""
        try:
            # Create tracer provider
            resource = Resource.create({
                "service.name": "contract-intelligence-orchestrator",
                "service.version": "1.0.0",
                "deployment.environment": os.getenv("ENVIRONMENT", "development")
            })
            
            provider = TracerProvider(resource=resource)
            
            # Setup Jaeger exporter
            jaeger_exporter = JaegerExporter(
                agent_host_name=os.getenv("JAEGER_HOST", "localhost"),
                agent_port=int(os.getenv("JAEGER_PORT", "6831"))
            )
            
            # Add span processor
            provider.add_span_processor(BatchSpanProcessor(jaeger_exporter))
            
            # Set global tracer provider
            trace.set_tracer_provider(provider)
            self.tracer = trace.get_tracer(__name__)
            
            logger.info("Tracing initialized successfully")
            
        except Exception as e:
            logger.error("Failed to initialize tracing", error=str(e))
    
    def _setup_sentry(self):
        """Setup Sentry error tracking"""
        try:
            sentry_dsn = os.getenv("SENTRY_DSN")
            if sentry_dsn:
                sentry_sdk.init(
                    dsn=sentry_dsn,
                    environment=os.getenv("ENVIRONMENT", "development"),
                    integrations=[
                        FastApiIntegration(),
                        CeleryIntegration(),
                        RedisIntegration(),
                        SqlalchemyIntegration()
                    ],
                    traces_sample_rate=0.1,
                    profiles_sample_rate=0.1
                )
                self.sentry_initialized = True
                logger.info("Sentry initialized successfully")
            else:
                logger.warning("SENTRY_DSN not provided, skipping Sentry setup")
                
        except Exception as e:
            logger.error("Failed to initialize Sentry", error=str(e))
    
    def _setup_instrumentation(self):
        """Setup automatic instrumentation"""
        try:
            # Instrument Redis
            RedisInstrumentor().instrument()
            
            # Instrument SQLAlchemy
            SQLAlchemyInstrumentor().instrument()
            
            # Instrument HTTP requests
            RequestsInstrumentor().instrument()
            
            # Instrument Celery
            CeleryInstrumentor().instrument()
            
            logger.info("Instrumentation setup completed")
            
        except Exception as e:
            logger.error("Failed to setup instrumentation", error=str(e))
    
    def instrument_fastapi(self, app):
        """Instrument FastAPI application"""
        try:
            FastAPIInstrumentor().instrument_app(app)
            
            # Add metrics endpoint
            @app.get("/metrics")
            async def metrics():
                return PlainTextResponse(
                    generate_latest(),
                    media_type=CONTENT_TYPE_LATEST
                )
            
            # Add middleware for request metrics
            @app.middleware("http")
            async def metrics_middleware(request: Request, call_next):
                start_time = time.time()
                
                # Increment active requests
                ACTIVE_REQUESTS.labels(
                    method=request.method,
                    endpoint=request.url.path
                ).inc()
                
                try:
                    response = await call_next(request)
                    
                    # Record request metrics
                    REQUEST_COUNT.labels(
                        method=request.method,
                        endpoint=request.url.path,
                        status=response.status_code
                    ).inc()
                    
                    return response
                    
                finally:
                    # Decrement active requests
                    ACTIVE_REQUESTS.labels(
                        method=request.method,
                        endpoint=request.url.path
                    ).dec()
                    
                    # Record duration
                    duration = time.time() - start_time
                    REQUEST_DURATION.labels(
                        method=request.method,
                        endpoint=request.url.path
                    ).observe(duration)
            
            logger.info("FastAPI instrumentation completed")
            
        except Exception as e:
            logger.error("Failed to instrument FastAPI", error=str(e))
    
    @contextmanager
    def trace_span(self, name: str, attributes: Optional[Dict[str, Any]] = None):
        """Context manager for tracing spans"""
        if not self.tracer:
            yield
            return
        
        span = self.tracer.start_span(name, attributes=attributes or {})
        try:
            yield span
        except Exception as e:
            span.record_exception(e)
            span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
            raise
        finally:
            span.end()
    
    def record_celery_task(self, task_name: str, status: str, duration: float = None):
        """Record Celery task metrics"""
        CELERY_TASK_COUNT.labels(task_name=task_name, status=status).inc()
        
        if duration is not None:
            CELERY_TASK_DURATION.labels(task_name=task_name).observe(duration)
    
    def record_redline_latency(self, agreement_id: str, duration: float):
        """Record redline generation latency"""
        REDLINE_LATENCY.labels(agreement_id=agreement_id).observe(duration)
    
    def record_risk_report_latency(self, agreement_id: str, duration: float):
        """Record risk report generation latency"""
        RISK_REPORT_LATENCY.labels(agreement_id=agreement_id).observe(duration)
    
    def record_approval_sla_breach(self, gate_id: str, org_id: str):
        """Record approval SLA breach"""
        APPROVAL_SLA_BREACHES.labels(gate_id=gate_id, org_id=org_id).inc()
    
    def record_signature_webhook_lag(self, envelope_id: str, lag: float):
        """Record signature webhook processing lag"""
        SIGNATURE_WEBHOOK_LAG.labels(envelope_id=envelope_id).observe(lag)
    
    def capture_exception(self, exception: Exception, context: Dict[str, Any] = None):
        """Capture exception in Sentry"""
        if self.sentry_initialized:
            sentry_sdk.capture_exception(exception)
        
        logger.error("Exception captured", 
                    exception=str(exception),
                    context=context or {})

# Global observability manager
observability = ObservabilityManager()

def trace_function(name: str = None, attributes: Dict[str, Any] = None):
    """Decorator to trace function execution"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            func_name = name or f"{func.__module__}.{func.__name__}"
            start_time = time.time()
            
            with observability.trace_span(func_name, attributes) as span:
                try:
                    result = func(*args, **kwargs)
                    duration = time.time() - start_time
                    
                    # Add duration to span
                    span.set_attribute("duration", duration)
                    
                    return result
                    
                except Exception as e:
                    duration = time.time() - start_time
                    span.set_attribute("duration", duration)
                    observability.capture_exception(e, {
                        "function": func_name,
                        "duration": duration
                    })
                    raise
        
        return wrapper
    return decorator

def monitor_celery_task(task_name: str = None):
    """Decorator to monitor Celery task execution"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            name = task_name or func.__name__
            start_time = time.time()
            
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                
                observability.record_celery_task(name, "success", duration)
                return result
                
            except Exception as e:
                duration = time.time() - start_time
                observability.record_celery_task(name, "failure", duration)
                observability.capture_exception(e, {
                    "task": name,
                    "duration": duration
                })
                raise
        
        return wrapper
    return decorator
