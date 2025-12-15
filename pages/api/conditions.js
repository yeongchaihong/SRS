import { connectDB } from "@/lib/mongodb";
import Condition from "@/models/Condition";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { age, bodyArea, panel } = req.query;

  try {
    await connectDB();

    const query = {};
    if (age) query.age = age;
    if (bodyArea) query.body_area = bodyArea;
    if (panel) query.panel = panel;

    const data = await Condition.find(query).limit(6000).lean();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
}
