import { formatUSD } from "./foodMeta.js";

export function renderPriceChart(meta){
  const current = Number(meta.priceFrom);
  const predicted = Number(meta.priceTo);

  const chartTitle = getChartTitle(meta.unit);

  if (!Number.isFinite(current) || !Number.isFinite(predicted) || current < 0 || predicted < 0) {
    return `
      <div class="focusChartCard">
        <div class="focusChartTitle">${chartTitle}</div>
        <div class="focusChartEmpty">Price data unavailable</div>
      </div>
    `;
  }

  const bars = [
    { label: "Current", value: current },
    { label: "Predicted", value: predicted }
  ];

  const maxValue = Math.max(...bars.map(bar => bar.value), 1);

  const barsHtml = bars.map((bar) => {
    const heightPercent = (bar.value / maxValue) * 100;

    return `
      <div class="focusChartBarGroup">
        <div class="focusChartBarWrap">
          <div class="focusChartBar" style="height: ${heightPercent}%;">
            <div class="focusChartBarValue">${formatUSDLabel(bar.value)}</div>
          </div>
        </div>
        <div class="focusChartXAxisLabel">${escapeHtml(bar.label)}</div>
      </div>
    `;
  }).join("");

  return `
    <div class="focusChartCard">
      <div class="focusChartTitle">${chartTitle}</div>

      <div class="focusChartPlot">
        <div class="focusChartBaseline" aria-hidden="true"></div>
        ${barsHtml}
      </div>
    </div>
  `;
}

function getChartTitle(unit){
  const cleanUnit = String(unit || "").trim().toLowerCase();

  if (!cleanUnit || cleanUnit === "each") {
    return `Average Price Per Item`
  }

  return `Average Price Per ${toTitleCase(cleanUnit)}`;
}

function formatUSDLabel(value){
  const num = Number(value);
  if (!Number.isFinite(num)) return formatUSD(value);
  return `$${num.toFixed(2)}`;
}

function toTitleCase(str){
  return String(str).replace(/\b\w/g, c => c.toUpperCase());
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}