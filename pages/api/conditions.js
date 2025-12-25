import { connectDB } from "@/lib/mongodb";
import Condition from "@/models/Condition";

// Increase response limit to handle large datasets
export const config = {
  api: {
    responseLimit: '8mb',
  },
};

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

    // Use .lean() for faster execution when you don't need Mongoose document methods
    const data = await Condition.find(query).limit(6000).lean();
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=59');
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