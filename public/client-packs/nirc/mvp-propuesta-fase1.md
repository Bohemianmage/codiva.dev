# NIRC — Propuesta MVP Fase 1  
## Unit economics · políticas · tiempos · cotización

Documento de trabajo para decisión comercial y arranque. Montos en **MXN, sin IVA**, salvo que se indique. Hipótesis marcadas como tales; validar SDI/IMSS con contador laboral antes de producción.

---

## 1. Alcance MVP Fase 1 (todo esto)

| Bloque | Incluye |
|--------|---------|
| Backoffice | Vacantes, aplicaciones, pools, validaciones, convocatorias, eventos, finanzas, catálogos, RBAC |
| Pool + FCFS | Score por labor, criterios, auto-blast, aceptación FCFS, waitlist, no-show/reemplazo |
| Carga masiva | Import CSV/Excel de candidatos/empleados (y actualización de pool), no solo alta manual por evento |
| Operación | QR, geocerca, check-in/out, evidencias |
| Entrada dura | INE → contrato adhesión (Cincel) → **alta IDSE aceptada** → recién entonces “Trabajando” |
| Salida | Baja IDSE + Stripe Connect + asientos básicos + auditoría |
| Privacy | Consentimientos, retención configurable, jobs disposal mínimos |
| Integraciones | IDSE PRO (sandbox→prod), Cincel, Stripe Connect, email/SMS |

Fuera de Fase 1 (fase 2+): EMA/EBA autodeterminación, face-match biométrico, WhatsApp masivo, Temporal cloud, app nativa, multi-país, CFDI automático al personal.

---

## 2. Unit economics — jornada de 1 día a $400

### 2.1 Referencias 2026

| Concepto | Valor | Fuente |
|----------|------:|--------|
| Pago al personal (día) | $400.00 | Premisa de negocio |
| SMG diario | $315.04 | CONASAMI 2026 |
| SM Frontera Norte | $440.87 | CONASAMI 2026 |
| UMA diaria | $117.31 | INEGI feb 2026 |
| Tope SBC (25 UMA) | $2,932.75 | 25 × 117.31 |

> Si la operación es en **Zona Libre Frontera Norte**, $400 está **bajo** el SM frontera ($440.87): hay que subir tarifa o no operar ahí con ese monto.

### 2.2 SDI / SBC propuesto (hipótesis)

Pago diario pactado: **$400** (lo que se dispersa al trabajador vía Stripe, salvo que se defina bruto con retención obrera).

Factor de integración típico 1er año (15 días aguinaldo, 12 vacaciones, 25% prima):

```text
factor = 1 + 15/365 + (12/365)×0.25 ≈ 1.049315
SDI = 400 × 1.049315 ≈ $419.73
```

| Escenario | SBC a reportar en IDSE (`salario_diario_integrado`) | Uso |
|-----------|-----------------------------------------------------|-----|
| **A — Recomendado** | **$419.73** | $400 retribución + factor prestaciones |
| B — Conservador simple | $400.00 | Solo si asesoría confirma que el día eventual se reporta sin factor |
| C — Frontera | ≥ $440.87 | Cumplir SM zona |

**Tipo trabajador IDSE típico staffing 1 día:** `codigo_tipo_de_trabajador = "2"` (eventual ciudad), `tipo_de_jornada = "1"` (un día), `tipo_de_salario` según política (frecuente `"0"` fijo o `"1"` variable).

### 2.3 Costo IMSS patrón (estimación presupuestal)

Las cuotas reales dependen de **prima de riesgo de trabajo** del RP y desglose LSS. Para cotizar MVP usamos carga patrón de referencia:

**≈ 32% del SBC × días cotizados** (IMSS + SAR/retiro + INFONAVIT + RT media). Validar con cédula real del patrón.

| Concepto | Cálculo | Monto |
|----------|---------|------:|
| SBC × 1 día | 419.73 | 419.73 |
| Carga patrón 32% | 419.73 × 0.32 | **$134.31** |
| Cuota obrera ref. ~2.375% | 419.73 × 0.02375 | $9.97 |

**Política MVP:** el **$400 es neto a dispersar**; la carga IMSS patrón ($134.31 est.) la absorbe la operación/cliente. Si se descuenta cuota obrera del trabajador, bajaría el neto — no recomendado en la promesa “$400 al día” sin avisarlo.

### 2.4 Stripe — 3.6% + $3

Sobre dispersión de **$400**:

```text
fee = 400 × 0.036 + 3 = 14.40 + 3 = $17.40
```

| Concepto | Monto |
|----------|------:|
| Transfer al personal | 400.00 |
| Fee Stripe | 17.40 |
| **Salida de caja por pago** | **417.40** |

> Confirmar con Stripe si el “+$3” aplica a Connect transfers/payouts en MXN o solo a cobro con tarjeta; la cotización usa la tarifa que indicaste.

### 2.5 Cincel (confirmado)

Modalidad cotizada para unit economics: **pago one-shot $60,000** → costo efectivo **$9.60 por documento**.

```text
60,000 / 9.60 = 6,250 documentos en el paquete
```

| Concepto | Monto | Notas |
|----------|------:|-------|
| Paquete one-shot | $60,000 | Incluye bolsa de firmas a **$9.60 / doc** |
| Documentos en paquete | 6,250 | 60,000 ÷ 9.60 |
| Implementación (una vez) | $3,200 | Setup; aparte del paquete salvo que Cincel lo bundle |
| Plan Business mensual (alt.) | $7,200 / 500 docs | Opción si no van one-shot; ≈ $14.40/doc en cupo |

**Premisa MVP:** 1 contrato de adhesión = 1 documento Cincel por jornada.  
**Costo Cincel / jornada (one-shot):** **$9.60**

### 2.6 IDSE PRO (por ciclo = alta + baja)

| Premisa | Valor |
|---------|------:|
| Movimientos / ciclo | 2 |
| Tarifa unitaria ref. (prepago ~2k mov/mes) | $5.00 |
| **Costo IDSE / jornada** | **$10.00** |

(A 1.5k mov/mes prepago ≈ $5.80 → $11.60/ciclo.)

### 2.7 Costo variable total por persona-día ($400)

| Rubro | Monto |
|-------|------:|
| Pago personal (Stripe) | 400.00 |
| Fee Stripe | 17.40 |
| IDSE alta + baja | 10.00 |
| Cincel (one-shot @ $9.60/doc) | 9.60 |
| IMSS patrón (est. 32% SBC 419.73) | 134.31 |
| **Total variable / jornada** | **$571.31** |

Si usaran plan mensual $7,200/500 sin one-shot: Cincel $14.40 → total ≈ **$576.11**.

**Precio mínimo sugerido al cliente final** (variable + 15% colchón ops, sin overhead fijo ni margen amplio):

```text
571.31 × 1.15 ≈ $657 / persona-día
```

Fijos/semi aparte: IDSE volumen, SMS, hosting, soporte; Cincel ya va prorrateado en el $9.60 si compraron el one-shot.

### 2.8 Ejemplo mensual (1,000 jornadas) — Cincel one-shot $9.60

| Rubro | Cálculo | Monto |
|-------|---------|------:|
| Pagos personal | 1,000 × 400 | 400,000 |
| Stripe | 1,000 × 17.40 | 17,400 |
| IDSE | 2,000 mov × $5 | 10,000 |
| Cincel | 1,000 × 9.60 | 9,600 |
| IMSS patrón est. | 1,000 × 134.31 | 134,310 |
| **Costo variable mes** | | **≈ $571,310** |
| One-shot Cincel (1 vez, bolsa 6,250 docs) | | 60,000 |
| Implementación Cincel (1 vez) | | 3,200 |

A 1,000 firmas/mes, la bolsa de 6,250 docs ≈ **6.25 meses** de runway de firmas.

---

## 3. Política: sin labor si no hay alta aceptada (propuesta)

### 3.1 Regla dura (MVP)

```text
Trabajando  ⇔  ContractSigned (Cincel)  AND  ImssAltaAccepted
```

- **No** basta `alta pendiente` / `submitted` / `lote_asignado` sin aceptación IMSS.  
- **No** hay check-in “parcial” que habilite piso de trabajo.  
- El personal puede estar en sitio en estado `En_proceso_entrada`, pero **no** cuenta como labor ni genera derecho a $400 hasta gate OK (definir si hay compensación de espera — ver 3.3).

### 3.2 Si Cincel falla

| Situación | Acción sistema | Acción ops |
|-----------|----------------|------------|
| Timeout / 5xx Cincel | Reintento cola (3× backoff); UI “Firma no disponible” | No abrir labor |
| Plantilla/sobre rechazado | Estado `firma_error`; ticket RH | Corregir datos; reenviar sobre |
| Cincel caído > SLA (ej. 15 min) | Escalamiento alerta | Contingencia: **no labor**; reprogramar o canal firma manual **solo si** compliance aprueba excepción documentada (fuera de happy path MVP) |

### 3.3 Si IDSE PRO / IMSS falla

| Situación | Acción |
|-----------|--------|
| IDSE PRO offline (reintentos proveedor) | Mantener `alta_pendiente`; **bloquear Trabajando** |
| Rechazo por datos | Incidencia RH; corregir expediente; nuevo movimiento; sin labor |
| IMSS lento (> ventana check-in, ej. 30–45 min) | Personal en sala de espera digital; opción ops: **liberar** y re-convocar FCFS waitlist; o reprogramar |
| Certificado RP vencido | Bloqueo total de altas ese RP; alerta Super Admin |

### 3.4 Compensación por espera (opción a decidir)

- **Opción A (MVP simple):** sin pago si no hay alta aceptada.  
- **Opción B:** “bono espera” fijo (ej. $50–100) si el fallo es del patrón/proveedor y el trabajador llegó a tiempo — **no** incluido en unit economics base hasta que lo aprueben.

---

## 4. Carga masiva (sí, en MVP)

No solo “armar evento a evento” a mano.

| Import | Formato | Efecto |
|--------|--------|--------|
| Candidatos / empleados | CSV/Excel | Alta/actualización masiva al pool + campos IDSE mínimos |
| Scores / labores (opcional) | CSV | Semilla de afinidad |
| Lista de convocatoria | CSV o desde query | Blast FCFS sobre set importado o filtrado |
| Eventos (fase 1.1) | Formulario + duplicar evento | Plantilla reutilizable; import masivo de eventos = nice-to-have si queda tiempo |

Validaciones al importar: NSS/CURP formato, duplicados, consentimiento flag, IDSE-ready.

---

## 5. Propuesta #4 — No-show, cancelación y reemplazo FCFS

### 5.1 Definiciones

| Caso | Definición |
|------|------------|
| **Cancelación temprana** | Libera cupo ≥ X horas antes (ej. 4 h); sin penalización fuerte |
| **Cancelación tarde** | < X horas; penaliza score |
| **No-show** | Confirmado + QR emitido + no check-in en ventana (ej. inicio + 30 min) |
| **Reemplazo** | Liberar cupo → auto-blast a waitlist / siguiente franja de score |

### 5.2 Máquina de estados (oferta / asignación)

```text
Offer accepted → Confirmado → QrIssued → En_proceso_entrada → Trabajando
                      ↓ cancel                    ↓ no-show
                 Cupo liberado              NoShow + penalización + reemplazo
```

### 5.3 Reglas

1. **Cancelación temprana:** cupo++; offer `cancelled_by_user`; score −0 o −2.  
2. **Cancelación tarde / no-show:** score −15 (configurable); flag `recent_no_show`; exclusiones temporales de blast (ej. 7–14 días).  
3. **Reemplazo automático:** job `convocatoria.refill` dispara a waitlist (orden FCFS de lista de espera) o enlarge blast.  
4. **Si ya hubo ContractSigned + Alta aceptada y abandona:**  
   - Check-out forzado / baja IDSE con causa (ej. abandono `"3"` o término `"1"` según legal).  
   - **No pagar** $400 (o pagar proporcional solo si compliance lo define).  
   - Stripe no se dispara.  
5. **Si el cliente cancela el evento:** liberar todas las offers; baja si ya hubo alta; política de pago al personal (mínimo garantizado) = decisión comercial aparte.  
6. Auditoría: todo no-show/cancel queda en `assignments` + `audit_logs`.

### 5.4 Parámetros MVP (defaults)

| Parámetro | Default sugerido |
|-----------|------------------|
| TTL oferta FCFS | 60 min |
| Ventana no-show tras hora inicio | 30 min |
| Cancelación “temprana” | ≥ 4 h antes |
| Penalización no-show | −15 score |
| Auto-refill | ON |
| Overbooking | OFF en fase 1 |

---

## 6. Tiempos MVP Fase 1

**Duración total: 18 semanas (~4.5 meses)** calendario, con UAT incluida.

| Fase | Semanas | Entregable |
|------|---------|------------|
| **0. Kickoff** | 1 | Ambientes, accesos sandbox IDSE/Cincel/Stripe, catálogo RP, plantilla adhesión |
| **1. Fundaciones** | 2–5 | Auth/RBAC, backoffice shell, empleados/expediente, **carga masiva**, consentimientos |
| **2. Pool + FCFS** | 6–9 | Labores, scoring, vacantes/aplicaciones básicas, convocatorias, offers, waitlist, no-show/refill |
| **3. Entrada dura** | 10–13 | QR, geocerca, INE/OCR básico, Cincel, IDSE alta, **gate sin Trabajando sin alta aceptada** |
| **4. Salida + dinero** | 14–16 | Check-out, baja IDSE, Stripe Connect, asientos simples, dashboard pagos |
| **5. UAT / go-live** | 17–18 | Pruebas punta a punta, capacitación, hardening, go-live asistido |

### Hitos de pago sugeridos (desarrollo)

| Hito | Semana | % |
|------|--------|--:|
| Arranque + fundaciones demo | 5 | 25% |
| Pool + FCFS en staging | 9 | 25% |
| Entrada dura (Cincel+IDSE) en staging | 13 | 25% |
| UAT firmada / producción | 18 | 25% |

### Equipo sugerido

- 1 Tech lead / arquitectura  
- 2 Full-stack (Next + Nest)  
- 1 Diseño UI part-time (backoffice + app personal)  
- QA embebido en el equipo (no dedicación full aparte en cotización base)

---

## 7. Cotización — qué incluye y qué no

### 7.0 Separación de presupuestos (importante)

| Presupuesto | ¿Qué es? | Monto ref. |
|-------------|----------|------------|
| **A. Desarrollo (este contrato)** | Software, integraciones, UAT, capacitación | **$980,000** paquete completo |
| **B. Proveedores externos** | Licencias/consumo Cincel, IDSE, Stripe, SMS, cloud | **Cliente paga directo** a cada vendor |
| **C. Operación por jornada** | $400 + fees + IMSS + docs (§2) | **≈ $571** / persona-día |

Los **$980,000 son solo desarrollo**. No incluyen saldo ni mensualidades de terceros. Sin contratos/sandbox de proveedores, las integraciones no pueden certificarse en producción (el código sí se entrega con adapters + sandbox).

### 7.1 Paquete completo — solo desarrollo

| Concepto | Monto MXN |
|----------|----------:|
| Diseño + desarrollo + integración MVP Fase 1 (§1) | **$980,000** |
| Gestión de proyecto / UAT / capacitación | Incluido |
| **Total desarrollo** | **$980,000** (+ IVA si aplica) |

Incluye: wiring a APIs (IDSE PRO, Cincel, Stripe Connect, email/SMS), colas, backoffice, FCFS, QR, gates, carga masiva, asientos básicos.  
No incluye: comprar ni fondear esos servicios.

### 7.2 Alternativa por franjas (solo desarrollo)

| Paquete | Alcance | Monto |
|---------|---------|------:|
| **MVP Core** | Sin OCR avanzado, SMS→email+push, un solo RP | $780,000 |
| **MVP Completo (recomendado)** | §1 íntegro | **$980,000** |
| **MVP + hypercare 4 sem** | Completo + mes post go-live | $1,120,000 |

### 7.3 Proveedores externos — presupuesto aparte (cliente)

#### Setup / one-shot (antes o en paralelo al go-live)

| Proveedor | Concepto | Monto est. MXN |
|-----------|----------|---------------:|
| Cincel | One-shot bolsa docs @ $9.60 → $60,000 | 60,000 |
| Cincel | Implementación | 3,200 |
| IDSE PRO | Prepago inicial / depósito (según contrato ApiMarket; ej. tramo ~2k mov) | 10,000 – 50,000 |
| Stripe | Sin fee de alta típica; KYC Connect | 0 |
| Cloud | Setup proyecto (suele ser bajo) | 0 – 5,000 |
| Legal | Plantilla adhesión + dictamen SDI (orden de magnitud) | 15,000 – 40,000 |
| **Total setup externos (orden de magnitud)** | | **≈ $88k – $158k** |

#### Mensual / variable en operación

| Proveedor | Cómo se cobra | Ref. @ 1,000 jornadas/mes |
|-----------|---------------|--------------------------:|
| Cincel | $9.60/doc (de la bolsa one-shot) | 9,600 (consumo bolsa) |
| IDSE PRO | $/movimiento (alta+baja) | ~10,000 |
| Stripe | 3.6% + $3 sobre payout | 17,400 |
| IMSS | Cuotas patrón (no es “SaaS”) | ~134,310 |
| SMS/email | Por envío | 2,000 – 15,000 |
| Hosting (Vercel/DB/Redis/S3) | Infra | 10,000 – 18,000 |
| **Subtotal ops (sin el $400 al personal)** | | **≈ $183k – $204k** |
| **+ pagos al personal** | 1,000 × $400 | **+ $400,000** |

### 7.4 Vista combinada para el cliente (ejemplo go-live)

| Concepto | Monto |
|----------|------:|
| A. Desarrollo MVP Completo | **980,000** |
| B. Setup proveedores (rango medio ~$120k) | **~120,000** |
| **Inversión inicial aprox.** | **≈ $1,100,000** |
| Luego: costo por jornada | **≈ $571** (+ precio al cliente final) |
| Luego: hosting + SMS + IDSE prepago según uso | variable mensual |

### 7.5 Condiciones comerciales (solo desarrollo)

- Vigencia: **30 días**. Precios **antes de IVA**.  
- SPEI por hitos §6.  
- Repo y `/docs` del cliente.  
- Garantía defectos: **30 días** post go-live (alcance acordado).  
- Soporte opcional: **$45,000/mes**.  
- El cliente debe proveer en semana 0: sandbox/prod credentials IDSE, Cincel, Stripe; RP y certificados.

---

## 8. Checklist de decisiones antes de firmar

- [ ] ¿$400 es neto a Stripe o bruto con descuento obrero?  
- [ ] ¿SDI $419.73 (escenario A) aprobado por contador?  
- [ ] ¿Operan en frontera norte? (SM $440.87)  
- [x] Cincel: one-shot **$60,000** → **$9.60/doc**; impl. $3,200  
- [x] Desarrollo: paquete completo **$980,000** (sin proveedores)  
- [ ] ¿Opción A o B de compensación por espera (§3.4)?  
- [ ] Prima de riesgo RT real del RP para afinar el 32%  
- [ ] Presupuesto setup externos aprobado aparte (§7.3)  
- [ ] Accesos sandbox IDSE + Cincel + Stripe Connect en semana 0  

---

## 9. Resumen ejecutivo

| Tema | Decisión propuesta MVP |
|------|------------------------|
| Labor sin alta | **Prohibida** — adhesión firmada + alta IMSS **aceptada** |
| Falla Cincel/IDSE | Bloqueo + reintentos + alerta |
| Carga masiva | **Sí** en Fase 1 |
| No-show | Penalización + auto-refill FCFS |
| Costo var. / día $400 | **≈ $571** |
| Precio piso cliente | **≈ $657** / persona-día |
| Tiempo | **18 semanas** |
| **Desarrollo** | **$980,000 MXN** — **solo software** |
| **Proveedores** | **Aparte** (Cincel, IDSE, Stripe, cloud, SMS, legal) |

---

*Documento generado para NIRC / Codiva — Agosto 2026. No sustituye dictamen legal ni cédula IMSS real.*
