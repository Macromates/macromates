import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function MacroPie({ data }) {
  console.log("MacroPie received data:", data);

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.values,
        backgroundColor: data.colors,
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 20,
    },
    plugins: {
      legend: {
        position: "bottom",
        onClick: null, // Disable legend click functionality
        labels: {
          font: {
            size: 16,
            family: "system-ui, Avenir, Helvetica, Arial, sans-serif",
          },
          generateLabels: function (chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                return {
                  text: label,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: "transparent", // Remove border from legend boxes
                  lineWidth: 0, // Remove border width
                  fontColor: "#6b6b6b", // Set text color to match bar chart
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        titleFont: {
          size: 18,
          family: "system-ui, Avenir, Helvetica, Arial, sans-serif",
        },
        bodyFont: {
          size: 16,
          family: "system-ui, Avenir, Helvetica, Arial, sans-serif",
        },
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value}g (${percentage}%)`;
          },
        },
      },
    },
    animation: {
      onComplete: function (animation) {
        const chart = animation.chart;
        const ctx = chart.ctx;
        const meta = chart.getDatasetMeta(0);

        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        meta.data.forEach((element, index) => {
          const value = chart.data.datasets[0].data[index];
          const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);

          const position = element.tooltipPosition();
          const text1 = `${value}g`;
          const text2 = `${percentage}%`;

          // Add thick shadow effect
          ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
          ctx.shadowBlur = 6;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          // Draw grams with larger font
          ctx.fillStyle = "#fff";
          ctx.font =
            "bold 18px system-ui, Avenir, Helvetica, Arial, sans-serif";
          ctx.fillText(text1, position.x, position.y - 10);

          // Draw percentage with smaller font and more spacing
          ctx.font =
            "bold 15px system-ui, Avenir, Helvetica, Arial, sans-serif";
          ctx.fillText(text2, position.x, position.y + 10);
        });

        ctx.restore();
      },
    },
  };

  return (
    <div style={{ height: "300px", width: "100%" }}>
      <Pie data={chartData} options={options} />
    </div>
  );
}
