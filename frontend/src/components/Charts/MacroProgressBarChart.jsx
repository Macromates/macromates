import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

export default function MacroProgressBarChart({
  dailyMacros,
  totalTargetMacros,
}) {
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 16,
            family: "system-ui, Avenir, Helvetica, Arial, sans-serif",
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
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 14,
            family: "system-ui, Avenir, Helvetica, Arial, sans-serif",
          },
        },
      },
      y: {
        ticks: {
          font: {
            size: 14,
            family: "system-ui, Avenir, Helvetica, Arial, sans-serif",
          },
        },
      },
    },
  };

  const barChartData = {
    labels: ["Protein", "Carbs", "Fats"],
    datasets: [
      {
        label: "Target Macros",
        data: [
          totalTargetMacros?.protein || 0,
          totalTargetMacros?.carbs || 0,
          totalTargetMacros?.fats || 0,
        ],
        backgroundColor: ["#FF6384", "#FF6384", "#FF6384"],
      },
      {
        label: "Consumed",
        data: [
          dailyMacros?.tot_protein_g || 0,
          dailyMacros?.tot_carbs_g || 0,
          dailyMacros?.tot_fat_g || 0,
        ],
        backgroundColor: ["#FF9F40", "#FF9F40", "#FF9F40"], // All same orange color
      },
    ],
  };

  return <Bar data={barChartData} options={barChartOptions} />;
}
