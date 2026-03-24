export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "Image file is required." }, { status: 400 });
  }

  return Response.json({
    text: "Water, Glycerin, Fragrance",
    source: "mock",
    filename: file.name,
  });
}
