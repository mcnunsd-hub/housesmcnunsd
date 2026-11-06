# MCNUN — Estructura de participantes

## Cambios aplicados
- 0006: añade validator y participant al enum de acceso; no asigna roles a ninguna cuenta.
- 0007: crea houses con RLS y permisos explícitos; añade email opcional, participant_group, UUID estable basado en user_id, id y proyecciones de escuela/aprobación. Conserva status active/pending/rejected y participant_type usados por el registro actual. Incorpora grupos advisor y departamento como clasificación, no nuevos flujos de inscripción.
- 0007: impide concesiones de roles a la propia cuenta; añade políticas restrictivas de privacidad incluso para cuentas con roles combinados; feed agregado por House/día sin nombres, IDs individuales ni hora exacta; scores_locked se aplica en RPC, vista y lectura directa.
- 0008: house_id generado en profiles, nullable, FK a houses; no asignación por defecto ni segunda fuente de afiliaciones.
- Tipos regenerados automáticamente en cada migración.
- Se insertan solo las cuatro Houses oficiales con los colores indicados. No se insertan participantes ni se modifican afiliaciones.

## Verificación realizada
- 37 pruebas Vitest aprobadas (7 contratos de esquema nuevos y 30 pruebas existentes).
- Lectura de esquema real: cuatro Houses oficiales; RLS activado; sin permiso UPDATE de House, grupo o roles; identificadores estables coinciden con user_id; FK validada.
- Antes y después: cuatro participantes, cuatro afiliaciones existentes; campos originales conservados.
- Consulta desde sesión delegate real: cuatro Houses, cuatro totales, feed sin identidad individual y referencia House coherente; sin errores en esas consultas.
- anon no tiene permiso para ejecutar totales ni feed.
- Última comprobación de compilación: build OK.

## Límites
- No se activó scores_locked en producción para probar la rama true; permanece false como estaba. Esa rama está cubierta por contrato de esquema, no por prueba real con cambio de configuración.
- No se crearon cuentas ni se otorgaron roles Mesa/Staff/validator para probar combinaciones; permisos revisados en esquema, no E2E de cada rol.
- No se probaron altas ni cambios de House; no se usaron datos de menores ni registros ficticios.
- No se declara verificada la pantalla de registro: la captura de comprobación fue en blanco durante la carga, aunque las consultas autenticadas funcionaron. No se modificaron componentes.
- Email permanece opcional y sin rellenar; no se copian datos de Auth innecesariamente.
- Conservación compatible: aprobado se expone mediante approval_status; status mantiene active para no romper onboarding.
- Sin integración con MCNUN Retos, nuevos portales o cambios de algoritmo.