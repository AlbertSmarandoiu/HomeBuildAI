// utils/taskMapper.js

export const TASK_MAP = {
  glet: "Gletuire pereti",
  gletuire: "Gletuire pereti",
  "aplicare glet": "Gletuire pereti",
  vopsit: "Vopsit lavabil (2 straturi)",
  lavabil: "Vopsit lavabil (2 straturi)",
  "vopsire pereti": "Vopsit lavabil (2 straturi)",
  parchet: "Montat parchet laminat",
  "montaj parchet": "Montat parchet laminat"
  // adaugă aici toate lucrările pe care le ai în pricingData
};

/**
 * Mapăm lista de intenții LLM la cheile exacte din pricingData
 * @param {string[]} intentii
 * @returns {string[]} sarcini valide
 */
export function mapIntentiiLaSarcini(intentii) {
  return intentii
    .map(i => TASK_MAP[i.toLowerCase()])
    .filter(Boolean);
}
