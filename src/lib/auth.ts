import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise, { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

export const authOptions: NextAuthOptions = {
  adapter: isProductionBuild ? undefined : MongoDBAdapter(clientPromise),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      await connectToDatabase();

      if (user?.email) {
        const dbUser = await User.findOneAndUpdate(
          { email: user.email },
          { $setOnInsert: { role: "user", createdAt: new Date() } },
          { new: true, upsert: true },
        );
        token.sub = String(dbUser._id);
        token.role = dbUser.role ?? "user";
      } else if (token.email) {
        const dbUser = await User.findOne({ email: token.email });
        token.role = dbUser?.role ?? "user";
        if (dbUser?._id) token.sub = String(dbUser._id);
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.role = token.role ?? "user";
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
