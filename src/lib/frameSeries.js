const imageFiles = import.meta.glob("../frames/demo/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});

export const DEMO_FRAMES = Object.entries(imageFiles)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([path, image]) => ({
    src: image,
    name: path.split("/").pop(),
  }));
