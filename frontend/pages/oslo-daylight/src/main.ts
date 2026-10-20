import "./style.css";
import data from "./data.json";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Filler,
  Tooltip,
  type ChartConfiguration,
  type Plugin,
} from "chart.js";

Chart.register(LineController, LineElement, PointElement, LinearScale, Filler, Tooltip);

const days = data.days;
const n = days.length;

function todayIndex(): number {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: data.timeZone }).format(new Date());
  const i = days.findIndex((d) => d.date === today);
  return i >= 0 ? i : Math.floor(n / 2);
}

function monthStartTicks(): number[] {
  return days.reduce<number[]>((ticks, d, i) => {
    if (d.date.endsWith("-01")) ticks.push(i);
    return ticks;
  }, []);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthOf(index: number): string {
  const [, m] = days[index].date.split("-");
  return MONTHS[Number(m) - 1];
}

function formatHM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = Math.round(totalMinutes % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// Vertical marker for the day selected with the slider, plus a dot on each line.
const selectionPlugin: Plugin<"line"> = {
  id: "selection",
  afterDatasetsDraw(chart) {
    const index = selectedIndex;
    const xScale = chart.scales.x;
    const ySunScale = chart.scales.ySun;
    if (!xScale || !ySunScale) return;
    const x = xScale.getPixelForValue(index);
    const ctx = chart.ctx;
    const top = chart.chartArea.top;
    const bottom = chart.chartArea.bottom;

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    const day = days[index];
    for (const [value, color] of [
      [day.sunriseMin, "#ffd166"],
      [day.sunsetMin, "#f4845f"],
    ] as const) {
      const y = ySunScale.getPixelForValue(value);
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#1a1a2e";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  },
};

let selectedIndex = todayIndex();

const monthTicks = new Set(monthStartTicks());

const config: ChartConfiguration<"line"> = {
  type: "line",
  data: {
    labels: days.map((d) => d.date),
    datasets: [
      {
        label: "Sunset",
        data: days.map((d, i) => ({ x: i, y: d.sunsetMin })),
        borderColor: "#f4845f",
        backgroundColor: "rgba(255, 209, 102, 0.18)",
        pointRadius: 0,
        borderWidth: 2,
        yAxisID: "ySun",
        fill: false,
        tension: 0.15,
      },
      {
        label: "Sunrise",
        data: days.map((d, i) => ({ x: i, y: d.sunriseMin })),
        borderColor: "#ffd166",
        backgroundColor: "rgba(255, 209, 102, 0.18)",
        pointRadius: 0,
        borderWidth: 2,
        yAxisID: "ySun",
        fill: "-1",
        tension: 0.15,
      },
      {
        label: "Day length",
        data: days.map((d, i) => ({ x: i, y: d.dayLengthMin / 60 })),
        borderColor: "#7fd1b9",
        borderDash: [5, 3],
        pointRadius: 0,
        borderWidth: 2,
        yAxisID: "yHours",
        fill: false,
        tension: 0.15,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    animation: false,
    onClick(evt, _els, chart) {
      const xScale = chart.scales.x;
      if (evt.x == null) return;
      const value = Math.round(xScale.getValueForPixel(evt.x) ?? selectedIndex);
      setSelected(Math.min(n - 1, Math.max(0, value)));
    },
    plugins: {
      tooltip: {
        backgroundColor: "#1a1a2ee6",
        titleColor: "#f5f5f5",
        bodyColor: "#f5f5f5",
        borderColor: "#444",
        borderWidth: 1,
        callbacks: {
          title: (items) => formatDate(days[items[0].dataIndex].date),
          label: (item) => {
            const day = days[item.dataIndex];
            if (item.dataset.label === "Day length") return `Day length: ${formatDuration(day.dayLengthMin)}`;
            if (item.dataset.label === "Sunrise") return `Sunrise: ${day.sunrise}`;
            return `Sunset: ${day.sunset}`;
          },
        },
      },
      legend: { display: false },
    },
    scales: {
      x: {
        type: "linear",
        min: 0,
        max: n - 1,
        grid: { color: "rgba(255,255,255,0.08)" },
        ticks: {
          color: "#cfcfe8",
          autoSkip: false,
          callback: (value) => {
            const i = Math.round(Number(value));
            return monthTicks.has(i) ? monthOf(i) : "";
          },
        },
        afterBuildTicks: (axis) => {
          axis.ticks = monthStartTicks().map((value) => ({ value }));
        },
      },
      ySun: {
        type: "linear",
        min: 0,
        max: 24 * 60,
        position: "left",
        grid: { color: "rgba(255,255,255,0.08)" },
        ticks: {
          color: "#cfcfe8",
          stepSize: 120,
          callback: (value) => formatHM(Number(value)),
        },
        title: { display: true, text: "Time of day", color: "#cfcfe8" },
      },
      yHours: {
        type: "linear",
        min: 0,
        max: 24,
        position: "right",
        grid: { display: false },
        ticks: { color: "#7fd1b9", stepSize: 4, callback: (v) => `${v}h` },
        title: { display: true, text: "Day length (hours)", color: "#7fd1b9" },
      },
    },
  },
  plugins: [selectionPlugin],
};

const canvas = document.querySelector<HTMLCanvasElement>("#chart")!;
const chart = new Chart(canvas, config);

const slider = document.querySelector<HTMLInputElement>("#day-slider")!;
slider.max = String(n - 1);
const summary = document.querySelector<HTMLElement>("#summary")!;

function renderSummary(index: number) {
  const day = days[index];
  summary.innerHTML = `
    <div class="summary-date">${formatDate(day.date)}</div>
    <div class="summary-stats">
      <div><span class="dot sunrise"></span>Sunrise <strong>${day.sunrise}</strong></div>
      <div><span class="dot sunset"></span>Sunset <strong>${day.sunset}</strong></div>
      <div><span class="dot length"></span>Day length <strong>${formatDuration(day.dayLengthMin)}</strong></div>
    </div>
  `;
}

function setSelected(index: number) {
  selectedIndex = index;
  slider.value = String(index);
  renderSummary(index);
  chart.update("none");
}

slider.addEventListener("input", () => setSelected(Number(slider.value)));
setSelected(selectedIndex);
