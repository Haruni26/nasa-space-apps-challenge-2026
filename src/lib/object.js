// Objects the Explorer can show. "folder" is the folder inside src/frames/ that holds the PNGs.
// To add an object: make src/frames/<folder>/, drop its PNGs in, and add a line here.
export const OBJECTS = [
  { id: "epsilon-indi", name: "Epsilon Indi", folder: "epsilon_indi_dir" },
];

// Every frame comes in two versions, told apart by the end of the file name (..._lin.png, ..._stretch.png).
export const SCALES = [
  { id: "stretch", label: "Stretched (asinh 0.4)" },
  { id: "lin", label: "Linear" },
];
