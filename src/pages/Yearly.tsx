import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import Color from "colorjs.io";
import { getYearlyEmissionsBySuburb } from "../requests/suburbs";
import { Emission, EmissionsBySuburb, SuburbsIndexed } from "../types";
import "./Yearly.css";

export const Yearly = ({
  years,
  suburbs,
}: {
  years: number[];
  suburbs: SuburbsIndexed;
}) => {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  );

  type SortOptions = "high" | "low";

  const [emissionsBySuburb, setEmissionsBySuburb] = useState<EmissionsBySuburb>(
    []
  );
  const [sort, setSort] = useState<SortOptions>("high");

  const sortOptions: SortOptions[] = ["high", "low"];

  useEffect(() => {
    const fetch = async () => {
      const results = await getYearlyEmissionsBySuburb();
      setEmissionsBySuburb(results);
    };
    fetch();
  }, []);

  const labels = years;

  type SuburbGrowth = {
    suburbId: number;
    growth: number;
  };

  const suburbGrowth: SuburbGrowth[] = [];

  for (const suburbId in emissionsBySuburb) {
    const emissions = emissionsBySuburb[suburbId];
    emissions.sort((e1, e2) => e2.reading - e1.reading);
    const [max, min] = [
      emissions[0].reading,
      emissions[emissions.length - 1].reading,
    ];
    suburbGrowth.push({
      suburbId: parseInt(suburbId),
      growth: max - min,
    });
  }
  suburbGrowth.sort((sg1, sg2) => sg2.growth - sg1.growth);

  type Dataset = {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    hidden: boolean;
  };

  const datasets: Dataset[] = [];

  suburbGrowth.map((sg, i) => {
    const emissionYearMap: { [key: number]: Emission } = {};
    emissionsBySuburb[sg.suburbId].map(
      (emission) => (emissionYearMap[emission.year] = emission)
    );
    const data = years.map((year) => emissionYearMap[year].reading);

    const rgb = [Math.random(), Math.random(), Math.random()];

    const backgroundColor = new Color("sRGB", rgb, 0.2);
    const borderColor = new Color("sRGB", rgb);

    let hidden;
    if (sort === "high") {
      hidden = i < 5 ? false : true;
    } else {
      hidden = suburbGrowth.length - 1 - i < 5 ? false : true;
    }

    if (!suburbs[sg.suburbId]) return;
    const dataset = {
      label: suburbs[sg.suburbId].name,
      data,
      borderColor,
      backgroundColor,
      hidden,
    };
    datasets.push(dataset);
  });

  const data = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
    color: "white",
  };

  return (
    <div className="Yearly">
      <div className="YearlyContent">
        <h1>Yearly Emissions</h1>
        <h2>{sort === "high" ? "Highest" : "Lowest"} growth suburbs</h2>
        <Line options={options} data={data} />
        <div>
          {sortOptions.map((sortOption, i) => (
            <div key={`opt-${i}`}>
              <label>
                {sortOption}
                <input
                  type="radio"
                  onChange={() => setSort(sortOption)}
                  checked={sortOption === sort ? true : false}
                ></input>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
