// ── Formateador de valores ────────────────────────────────────────────────────
export function formatearValor(label, valor) {
  if (valor === null || valor === undefined || valor === "") return "-";
  const lbl = label.toLowerCase().trim();

  const esPorcentaje =
    lbl === "cumplimiento" ||
    lbl === "cumplimiento (%)" ||
    lbl === "eficiencia" ||
    lbl === "eficiencia (%)" ||
    lbl === "eficacia" ||
    lbl === "eficacia (%)" ||
    lbl === "efectividad" ||
    lbl === "efectividad (%)" ||
    lbl === "rendimiento" ||
    lbl === "rendimiento (%)";

  if (esPorcentaje) {
    return (parseFloat(valor) * 100).toFixed(2) + "%";
  }
  if (lbl.includes("productividad")) {
    const num = parseFloat(valor);
    return isNaN(num) ? String(valor) : num.toFixed(2);
  }
  const num = parseFloat(valor);
  return isNaN(num) ? String(valor) : num.toFixed(2);
}

// ── Motor matemático optimizado y seguro ──────────────────────────────────────
export function ejecutarMotor(campos, valores) {
  let contexto = {};
  campos.forEach((c) => {
    const raw = valores[c.campo_key];
    const lbl = c.campo_label.toLowerCase().trim();

    if (
      lbl.startsWith("fecha") &&
      raw &&
      typeof raw === "string" &&
      /^\d{4}-\d{2}-\d{2}/.test(raw)
    ) {
      contexto[c.campo_label] = new Date(raw).getTime() / 86400000;
    } else if (c.tipo === "texto") {
      contexto[c.campo_label] = raw ?? "";
    } else {
      contexto[c.campo_label] =
        raw === "" || raw === undefined || raw === null ? null : parseFloat(raw);
    }
  });

  let huboCambios = true;
  for (let pase = 1; pase <= 4 && huboCambios; pase++) {
    huboCambios = false;

    campos.forEach((c) => {
      if (c.origen !== "calculado" || !c.formula_personalizada) return;
      let formula = c.formula_personalizada;
      let canCalculate = true;

      for (const [label, value] of Object.entries(contexto)) {
        const safeLabel = label.replace(/[\[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        const regex = new RegExp(`\\[${safeLabel}\\]`, "g");
        if (formula.match(regex) && (value === null || value === undefined)) {
          canCalculate = false;
        }
        formula = formula.replace(
          regex,
          value !== null && value !== undefined ? value : 0,
        );
      }

      if (canCalculate) {
        if (!/[^0-9+\-*/().,\sMathmax inul=<>?!|&:]/i.test(formula)) {
          try {
            const evaluador = new Function("return " + formula);
            const resultado = evaluador();
            const valorFinal =
              !isNaN(resultado) && isFinite(resultado) ? resultado : null;
            if (contexto[c.campo_label] !== valorFinal) {
              contexto[c.campo_label] = valorFinal;
              huboCambios = true;
            }
          } catch (_) {
            if (contexto[c.campo_label] !== null) {
              contexto[c.campo_label] = null;
              huboCambios = true;
            }
          }
        }
      } else {
        if (contexto[c.campo_label] !== null) {
          contexto[c.campo_label] = null;
          huboCambios = true;
        }
      }
    });
  }
  return contexto;
}
