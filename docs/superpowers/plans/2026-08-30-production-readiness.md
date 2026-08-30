# Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preparar ExDev para producción con autenticación OIDC segura que solo use correo en activaciones sensibles, protección durable del cupo de Resend y un dashboard administrativo validado de extremo a extremo.

**Architecture:** Google y Microsoft siguen siendo la autenticación primaria mediante Authorization Code + PKCE. PostgreSQL conserva sesiones opacas y revocables, CSRF y la evidencia de que una identidad ya completó la activación por correo; los accesos posteriores del mismo `provider + subject` crean una sesión directamente. El mismo PostgreSQL serializa y registra cada intento de correo antes de invocar Resend para respetar límites globales y por usuario incluso con varias réplicas de Railway.

**Tech Stack:** React 19, Vite 6, TypeScript, Fastify 5, PostgreSQL, Vitest, Railway, Vercel y Resend.

**Spec:** Objetivo activo del hilo: no solicitar código en cada inicio, prevenir abuso del límite de 100 correos/día, asegurar backend y dashboard, y validar toda la aplicación local antes de producción.

## Global Constraints

- Los cursos y prácticas siguen siendo públicos; autenticar solo es obligatorio para datos personales, mensajería y administración.
- Los secretos permanecen únicamente en variables de entorno y nunca aparecen en pruebas, logs o frontend.
- Todos los cambios de comportamiento siguen RED → GREEN → refactor.
- La cookie de sesión continúa siendo opaca, `HttpOnly`, `Secure` en producción y protegida con CSRF para mutaciones.
- La interfaz y los errores visibles permanecen en español.
- No se descartan ni reescriben cambios ajenos del worktree.

---

### Task 1: Activación por correo solo cuando corresponde

**Files:**
- Modify: `/home/monasterios/Documents/v2/learning-platform-backend/src/modules/identity/authService.ts`
- Modify: `/home/monasterios/Documents/v2/learning-platform-backend/src/modules/identity/identityRepository.ts`
- Modify: `/home/monasterios/Documents/v2/learning-platform-backend/src/http/routes.ts`
- Test: `/home/monasterios/Documents/v2/learning-platform-backend/src/modules/identity/authService.test.ts`

**Interfaces:**
- `IdentityStore.establishIdentity()` produce el principal y `requiresEmailVerification`.
- `AuthService.completeLogin()` produce una unión discriminada `authenticated | verification_required`.
- El callback crea cookie de sesión directamente solo para identidades ya activadas del mismo proveedor.

- [x] Escribir pruebas que demuestren que una identidad nueva exige código y una identidad conocida no envía correo.
- [x] Ejecutar la prueba y comprobar que falla por el comportamiento actual.
- [x] Implementar la unión discriminada y reutilizar una única creación segura de sesión.
- [x] Adaptar el callback y comprobar cookies, retorno seguro y ausencia de desafío repetido.
- [x] Ejecutar pruebas unitarias e integración.

### Task 2: Presupuesto durable y antiabuso de correo

**Files:**
- Create: `/home/monasterios/Documents/v2/learning-platform-backend/migrations/007_auth_email_delivery_budget.sql`
- Modify: `/home/monasterios/Documents/v2/learning-platform-backend/src/config.ts`
- Modify: `/home/monasterios/Documents/v2/learning-platform-backend/src/modules/identity/authService.ts`
- Modify: `/home/monasterios/Documents/v2/learning-platform-backend/src/modules/identity/identityRepository.ts`
- Test: `/home/monasterios/Documents/v2/learning-platform-backend/src/config.test.ts`
- Test: `/home/monasterios/Documents/v2/learning-platform-backend/src/modules/identity/authService.test.ts`
- Test: `/home/monasterios/Documents/v2/learning-platform-backend/tests/integration/api.integration.test.ts`

**Interfaces:**
- `EMAIL_VERIFICATION_DAILY_LIMIT` queda en 90 por defecto y nunca supera 100.
- `EMAIL_VERIFICATION_USER_HOURLY_LIMIT` queda en 3 por defecto.
- Crear o rotar un desafío reserva el envío bajo un advisory lock de PostgreSQL antes de llamar a Resend.

- [x] Escribir pruebas de límite global, límite por usuario y reenvío sin sobrepasar el presupuesto.
- [x] Ejecutarlas y comprobar el fallo esperado.
- [x] Añadir la migración y las reservas transaccionales.
- [x] Mantener mensajes genéricos que no permitan enumerar cuentas.
- [x] Ejecutar pruebas unitarias e integración con PostgreSQL real.

### Task 3: Endurecimiento del backend y contrato administrativo

**Files:**
- Modify: `/home/monasterios/Documents/v2/learning-platform-backend/src/app.ts`
- Modify: `/home/monasterios/Documents/v2/learning-platform-backend/src/http/routes.ts`
- Modify: `/home/monasterios/Documents/v2/learning-platform-backend/src/http/schemas.ts`
- Test: `/home/monasterios/Documents/v2/learning-platform-backend/tests/integration/api.integration.test.ts`
- Create: `/home/monasterios/Documents/v2/learning-platform-backend/security_best_practices_report.md`

**Interfaces:**
- Todas las mutaciones autenticadas conservan verificación CSRF y autorización de servidor.
- Los endpoints de administración no dependen de controles visuales.
- Los headers, CORS, límites de cuerpo, rate limits y errores se validan con respuestas reales.

- [x] Enumerar rutas públicas, autenticadas, staff y admin con sus gates efectivos.
- [x] Escribir reproducciones para cualquier bypass o fuga confirmado.
- [x] Corregir hallazgos uno por uno con pruebas RED → GREEN.
- [x] Documentar hallazgos, impacto, evidencia y mitigación.
- [x] Ejecutar lint, pruebas, build y auditoría de dependencias con el gestor del lockfile.

### Task 4: Dashboard y seguimiento real

**Files:**
- Modify as required: `/home/monasterios/Documents/v2/scrimba-interactive-learning-engine/src/auth/StaffDashboard.tsx`
- Modify as required: `/home/monasterios/Documents/v2/scrimba-interactive-learning-engine/src/services/staffDashboardApi.ts`
- Test: `/home/monasterios/Documents/v2/scrimba-interactive-learning-engine/src/services/staffDashboardApi.test.ts`
- Test: `/home/monasterios/Documents/v2/learning-platform-backend/tests/integration/api.integration.test.ts`

**Interfaces:**
- El dashboard consume datos reales de usuarios, progreso, intentos, refuerzos, feedback y mensajes.
- Tutores ven seguimiento y mensajería; administradores además gestionan acceso, roles y catálogo.

- [x] Sembrar datos locales representativos en la base de prueba.
- [x] Verificar overview, búsqueda, detalle, feedback, mensajería, roles, bloqueo y contenido.
- [x] Crear pruebas para estados vacío, carga, error y permisos insuficientes.
- [x] Corregir contratos o UI solo cuando una reproducción falle.
- [x] Repetir el flujo en tema normal y cyber.

### Task 5: QA local y gate de lanzamiento

**Files:**
- Modify as required: `/home/monasterios/Documents/v2/scrimba-interactive-learning-engine/vercel.json`
- Modify as required: `/home/monasterios/Documents/v2/learning-platform-backend/docs/api.md`

**Interfaces:**
- El gate exige pruebas completas, compilación, auditoría de dependencias, headers, cookies y flujos de navegador.

- [x] Ejecutar lint, pruebas y build en frontend.
- [x] Ejecutar lint, pruebas completas e integración con PostgreSQL real y build en backend.
- [x] Probar localmente: entrada pública, contratos OIDC, sesión persistente, logout, dashboard, feedback y bloqueo.
- [x] Verificar desktop y móvil, carga, vacío y error.
- [x] Registrar riesgos externos que no puedan demostrarse localmente sin confundirlos con aceptación.
