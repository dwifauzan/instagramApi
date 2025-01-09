import { userFacebookService } from "@/pages/api/facebook-scrapper/userFacebookService";
import type { NextApiRequest, NextApiResponse } from "next";

// Fungsi handler untuk create account
const handlerAccount = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log(req.body);
  if (req.method === "POST") {
    try {
      const newAccount = await userFacebookService.create(req.body);
      const userFacebookId = newAccount.id;
      res.status(201).json({ newAccount, userFacebookId });
    } catch (error) {
      res.status(500).json({ error: "Failed to create account user" });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
};

const handler = {
  invoke: [
    {
      name: "createAccount",
      togo: handlerAccount, // Mengacu langsung ke fungsi handlerAccount
    },
  ],
};

export { handler };
