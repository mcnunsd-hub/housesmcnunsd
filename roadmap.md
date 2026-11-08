# Auditoría visual y laboratorio seguro
- [ ] Añadir modo borrador exclusivo de desarrollo en /registro para abrir un Dashboard simulado sin escribir datos.
- [ ] Añadir generador administrativo de casos de prueba con AI Gateway y validación estricta de la respuesta.
- [ ] Añadir laboratorio Super Admin de cuentas ficticias simuladas, validación de permisos en servidor e historial local.
- [ ] Verificar autorización, ausencia de escrituras en producción y recorridos principales.
- [ ] Crear cuentas reales aisladas — bloqueado: requiere un backend de pruebas separado; no se usará Auth de producción.

# Fase 1 — Onboarding y registro
- [x] Añadir estructura compatible de Houses, grupos e identidad estable sin modificar pantallas.
- [x] Reforzar privacidad de afiliaciones y bloqueo de marcadores en la base de datos.
- [x] Verificar esquema, tipos, permisos y lecturas autenticadas sin escribir participantes de prueba; 37 pruebas pasan.
- [ ] Comprobar bloqueo activado y permisos combinados Mesa/Staff — requiere entorno aislado o cuentas autorizadas; no se alteran ajustes ni roles de producción.
- [x] Conectar catálogos administrativos y preparar creación, edición y carga CSV/Excel validada.
- [ ] Verificar creación, edición e importación con lectura posterior en /admin — bloqueado: la sesión propia disponible no tiene rol administrativo; requiere sesión autorizada y datos de prueba aprobados.
- [ ] Centralizar acceso por sesión, ficha, estado y rol.
- [ ] Corregir retorno OAuth y confirmación de correo.
- [ ] Conectar registro y retirar toma de datos residual de Ceremonia.
- [ ] Validar elegibilidad de Ceremonia en servidor.
- [ ] Probar reglas y recorridos seguros; documentar pruebas manuales.
- [ ] Entregar informe de alcance, cambios y limitaciones.