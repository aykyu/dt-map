export type NonNormalisedData<T> = T & {
  reading: number | null;
};

export type NormalisedData<T> = T &
  NonNormalisedData<T> & {
    readingNormalised: number | null;
  };

export const applyRange = <T>(
  samples: NonNormalisedData<T>[]
): NormalisedData<T>[] => {
  let min = 999e5;
  let max = 0;
  samples.forEach((suburb) => {
    const { reading } = suburb;
    if (reading === null) return;
    if (reading < min) min = reading;
    if (reading > max) max = reading;
  });

  const samplesNormalised: NormalisedData<T>[] = samples.map((sample) => {
    let readingNormalised;
    if (sample.reading === null) {
      readingNormalised = null;
    } else if (max - min === 0) {
      readingNormalised = 0;
    } else {
      readingNormalised = (sample.reading - min) / (max - min);
    }
    return {
      ...sample,
      readingNormalised,
    };
  });
  return samplesNormalised;
};
