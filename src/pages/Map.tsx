import { useState, useEffect } from "react";
import Slider from "rc-slider";
import { Map as MapComponent } from "../components/Map";
import { Toggles } from "../components/Toggles";
import { getEmissionsBySuburb } from "../requests/suburbs";
import {
  SuburbsIndexed,
  SuburbWithData,
  InputToggle,
  Emission,
  Category,
} from "../types";
import { applyRange } from "../util";
import { colorSuburb } from "../util/colorSuburb";

import "leaflet/dist/leaflet.css";
import "rc-slider/assets/index.css";
import "./Map.css";

export const Map = ({
  suburbs,
  categories,
  years,
}: {
  suburbs: SuburbsIndexed;
  categories: Category[];
  years: number[];
}) => {
  type DataView = "aggregate" | "yearly";

  const [emissions, setEmissions] = useState<Emission[]>([]);
  const [selectedSuburb, setSelectedSuburb] = useState<number | undefined>();
  const [categoryToggles, setCategoryToggles] = useState<InputToggle[]>([]);
  const [sortToggles, setSortToggles] = useState<InputToggle[]>([
    {
      id: 1,
      name: "Desc",
      on: true,
    },
    {
      id: 2,
      name: "Asc",
      on: false,
    },
  ]);
  const [dataView, setDataView] = useState<DataView>("aggregate");
  const [year, setYear] = useState<number>();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const categoryToggles: InputToggle[] = categories.map((category) => ({
          ...category,
          on: true,
        }));
        setCategoryToggles(categoryToggles);
      } catch (e) {
        console.error(e);
      }
    };
    fetchInitialData();
  }, [categories]);

  useEffect(() => {
    const fetchEmissions = async () => {
      const categories = categoryToggles
        .filter((categoryToggle) => categoryToggle.on)
        .map((categoryToggle) => categoryToggle.id);
      const sort =
        sortToggles.find((sortToggle) => sortToggle.on)?.name.toLowerCase() ||
        "desc";
      const _emissions = await getEmissionsBySuburb(categories, year, sort);
      setEmissions(_emissions);
    };
    fetchEmissions();
  }, [year, categoryToggles, sortToggles]);

  const handleToggleDataView = (dataView: DataView) => {
    if (dataView === "aggregate") {
      setYear(undefined);
    } else if (dataView === "yearly") {
      setYear(years[0]);
    }
    setDataView(dataView);
  };

  let suburbsWithData: SuburbWithData[] = [];

  type SliderProps = {
    min: number;
    max: number;
    marks: { [key: number]: { style: object; label: string } };
  };

  const sliderProps: SliderProps = {
    min: 9e10,
    max: 0,
    marks: {},
  };

  suburbsWithData = emissions
    .map((emission) => ({
      ...suburbs[emission.suburbId],
      reading: emission.reading,
    }))
    .filter(
      (suburbWithdata) =>
        suburbWithdata.geoData && suburbWithdata.id && suburbWithdata.reading
    );

  suburbsWithData = applyRange(suburbsWithData);

  years.forEach((year) => {
    if (year < sliderProps.min) sliderProps.min = year;
    if (year > sliderProps.max) sliderProps.max = year;
    sliderProps.marks[year] = {
      style: { color: "white" },
      label: year.toString(),
    };
  });

  return (
    <div className="MapContainer">
      <MapComponent suburbs={suburbsWithData} selectedSuburb={selectedSuburb} />
      <div>
        <div className="AggregateTogglesContainer"></div>
        <div>
          {sortToggles.map((toggle, i) => (
            <span key={`sortToggle-${i}`}>
              <label htmlFor={toggle.name}>{toggle.name}</label>
              <input
                type={"radio"}
                name={toggle.name}
                checked={toggle.on}
                onChange={(e) =>
                  setSortToggles(
                    sortToggles.map((sortToggle) => ({
                      ...sortToggle,
                      on: toggle.id === sortToggle.id && e.target.checked,
                    }))
                  )
                }
              ></input>
            </span>
          ))}
        </div>
      </div>
      <div className={"CategoryToggles"}>
        <h3>Categories</h3>
        <Toggles
          toggleInputs={categoryToggles}
          setToggleInputs={setCategoryToggles}
        />
        <div>
          <h3>Aggregation</h3>
          <label>
            Aggregate
            <input
              type="radio"
              name="dataSelection"
              onChange={() => handleToggleDataView("aggregate")}
              checked={dataView === "aggregate"}
            ></input>
          </label>
          <label>
            Yearly
            <input
              type="radio"
              name="dataSelection"
              onChange={() => handleToggleDataView("yearly")}
              checked={dataView === "yearly"}
            ></input>
          </label>
          {dataView === "yearly" ? (
            <Slider
              marks={sliderProps.marks}
              step={null}
              min={sliderProps.min}
              max={sliderProps.max}
              onChange={(year) => {
                if (!Array.isArray(year)) {
                  setYear(year);
                }
              }}
              value={year}
            />
          ) : (
            <></>
          )}
        </div>
      </div>
      <div className="SuburbRankingPanel">
        <b>Ranking</b>
        {suburbsWithData.map((suburb, i) => {
          return (
            <div
              key={`rankedSuburb-${i}`}
              className={"Rank"}
              onMouseEnter={() => setSelectedSuburb(suburb.id)}
              style={{ color: colorSuburb(suburb.readingNormalised) }}
            >
              {i + 1}: <b>{suburb.name}</b>
            </div>
          );
        })}
      </div>
    </div>
  );
};
