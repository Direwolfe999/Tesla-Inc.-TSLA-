import HeroSub from "@/components/SharedComponent/HeroSub";
import NotFound from "@/components/NotFound";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 Page | NOT FOUND ",
};

const ErrorPage = () => {
  return (
    <>
      <HeroSub
        title="ERROR!!! 404"
      />
      <NotFound />
    </>
  );
};

export default ErrorPage;
