import React from "react";
import PricingSection from "../components/marketing_site/home/PricingSection";
import useDocumentTitle from "../hooks/useDocumentTitle";

const PricingPage: React.FC = () => {
    useDocumentTitle("Pricing");

    return (
        <>
            <PricingSection />
        </>
    );
};

export default PricingPage;
