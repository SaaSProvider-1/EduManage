import React, { useState } from "react";
import "./PricingSection.css";
import { Link } from "react-router-dom";

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);

  const pricingPlans = [
    {
      name: "Standard",
      description: "Ideal for growing educational institutions",
      price: { monthly: "2,999", yearly: "34,999" },
      originalPrice: { monthly: "4,999", yearly: "60,000" },
      duration: "per month",
      popular: true,
      features: [
        "Up to 100 students",
        "30 teachers",
        "Graph Visuals",
        "Fee management",
        "Exam scheduling",
        "Mobile Web app",
        "Custom notifications",
        "Grade management",
      ],
      limitations: [],
      cta: "Choose Standard",
      highlight: "Most popular choice",
    },
    {
      name: "Premium",
      description: "Complete solution for large institutions",
      price: { monthly: "4,999", yearly: "57,999" },
      originalPrice: { monthly: "6,999", yearly: "82,999" },
      duration: "per month",
      popular: false,
      features: [
        "Upto 500 students",
        "Upto 100 teachers",
        "Graph Visuals",
        "Fee management",
        "Exam scheduling",
        "Mobile Web app",
        "Custom notifications",
        "Grade management",
      ],
      limitations: [],
      cta: "Choose Premium",
      highlight: "Best value for large institutions",
    },
  ];

  const getCurrentPrice = (plan) => {
    return isYearly ? plan.price.yearly : plan.price.monthly;
  };

  const getOriginalPrice = (plan) => {
    return isYearly ? plan.originalPrice.yearly : plan.originalPrice.monthly;
  };

  const getSavings = (plan) => {
    if (!isYearly) return null;
    // Convert string prices to numbers by removing commas
    const monthlyPrice = parseInt(plan.price.monthly.replace(/,/g, ""));
    const yearlyPrice = parseInt(plan.price.yearly.replace(/,/g, ""));
    const monthlyTotal = monthlyPrice * 12;
    return monthlyTotal - yearlyPrice;
  };

  const formatSavings = (savings) => {
    if (!savings || savings <= 0) return null;
    return savings.toLocaleString("en-IN");
  };

  return (
    <section id="pricing" className="pricing-section section-white">
      <div className="pricing-container">
        <div className="pricing-section-header text-center animate-on-scroll">
          <h2 className="heading-lg">
            Simple, <span className="text-primary">Transparent</span> Pricing
          </h2>
          <p className="text-lg">
            Choose the perfect plan for your institution. Upgrade or downgrade
            anytime.
          </p>
        </div>

        <div className="pricing-toggle animate-on-scroll">
          <div className="toggle-container">
            <span className={`toggle-label ${!isYearly ? "active" : ""}`}>
              Monthly
            </span>
            <div
              className="price-toggle-switch"
              onClick={() => setIsYearly(!isYearly)}
            >
              <div
                className={`price-toggle-slider ${
                  isYearly ? "yearly" : "monthly"
                }`}
              ></div>
            </div>
            <span className={`toggle-label ${isYearly ? "active" : ""}`}>
              Yearly
              <span className="savings-badge">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="pricing-grid">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`pricing-card card ${
                plan.name === "Premium" ? "premium" : "standard"
              } animate-on-scroll ${plan.popular ? "popular" : ""}`}
              style={{
                boxShadow:
                  plan.name === "Premium"
                    ? "0px 0px 30px 2px rgba(255, 215, 0, 0.4)"
                    : "0px 0px 30px 2px #1d4fd877",
              }}
            >
              {/* {plan.popular && ( */}
              <div
                className={`popular-badge ${
                  plan.name === "Premium" ? "premium" : "standard"
                }`}
                style={{
                  background:
                    plan.name === "Premium"
                      ? "linear-gradient(135deg, gold, orange)"
                      : "linear-gradient(135deg, var(--primary-blue), #1d4ed8)",
                  boxShadow:
                    plan.name === "Premium"
                      ? "0px 0px 10px 2px rgba(255, 215, 0, 0.7)"
                      : "0px 0px 10px 2px #1d4ed8",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {plan.name === "Premium" ? "Best Value" : "Most Popular"}
              </div>
              {/* )} */}

              <div
                className={`price-card-body ${
                  plan.name === "Premium" ? "premium" : "standard"
                }`}
              >
                <div className="plan-header">
                  <h3 className="plan-name heading-sm">{plan.name}</h3>
                  <p className="plan-description">{plan.description}</p>
                </div>

                <div className="plan-pricing">
                  <div className="price-container">
                    <div className="current-price">
                      <span className="price-currency">₹</span>
                      {getOriginalPrice(plan) && (
                        <span className="original-price">
                          {getOriginalPrice(plan)}
                        </span>
                      )}
                      <span className="price-amount">
                        {getCurrentPrice(plan)}
                      </span>
                      <span className="price-duration">
                        /
                        {plan.name === "Free Trial"
                          ? plan.duration
                          : isYearly
                          ? "month"
                          : "month"}
                      </span>
                    </div>
                    {isYearly && plan.price.monthly > 0 && (
                      <div className="yearly-billing">
                        Billed yearly (₹{getCurrentPrice(plan)})
                      </div>
                    )}
                  </div>

                  {getSavings(plan) && getSavings(plan) > 0 && (
                    <div className="savings-info">
                      Save ₹{formatSavings(getSavings(plan))} per year
                    </div>
                  )}
                </div>

                <div className="plan-highlight">{plan.highlight}</div>

                <Link
                  to={`/tutor-register?plan=${plan.name.toLowerCase()}`}
                  className={`plan-cta choose-btn ${
                    plan.popular ? "choose-btn-primary" : "choose-btn-outline"
                  } choose-btn-large`}
                >
                  {plan.cta}
                  <svg
                    className="btn-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 12H19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 5L19 12L12 19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>

                <div className="plan-features">
                  <h4 className="plan-features-title">Everything included:</h4>
                  <ul className="plan-features-list">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="plan-feature-item">
                        <svg
                          className="check-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <polyline
                            points="20,6 9,17 4,12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {plan.limitations.length > 0 && (
                    <div className="limitations">
                      <h5 className="limitations-title">Limitations:</h5>
                      <ul className="limitations-list">
                        {plan.limitations.map((limitation, limitationIndex) => (
                          <li key={limitationIndex} className="limitation-item">
                            <svg
                              className="x-icon"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <line
                                x1="18"
                                y1="6"
                                x2="6"
                                y2="18"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <line
                                x1="6"
                                y1="6"
                                x2="18"
                                y2="18"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                            </svg>
                            {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pricing-faq animate-on-scroll">
          <div className="faq-content">
            <h3 className="heading-sm">Frequently Asked Questions</h3>
            <div className="faq-grid grid grid-2">
              <div className="faq-item">
                <h4>Can I change plans anytime?</h4>
                <p>
                  Yes, you can upgrade or downgrade your plan at any time.
                  Changes take effect immediately and we'll prorate the billing
                  accordingly.
                </p>
              </div>
              <div className="faq-item">
                <h4>Is there a setup fee?</h4>
                <p>
                  No, there are no setup fees or hidden charges. You only pay
                  for the plan you choose, and you can start with our free
                  trial.
                </p>
              </div>
              <div className="faq-item">
                <h4>What payment methods do you accept?</h4>
                <p>
                  We accept all major credit cards, debit cards, and UPI
                  payments. All transactions are secured with bank-level
                  encryption.
                </p>
              </div>
              <div className="faq-item">
                <h4>Do you offer refunds?</h4>
                <p>
                  Yes, we offer a 30-day money-back guarantee. If you're not
                  satisfied, we'll refund your money, no questions asked.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="last-section">
          <div className="enterprise-cta animate-on-scroll">
            <div className="enterprise-content">
              <h3 className="heading-sm">Need a Custom Solution?</h3>
              <p className="text-md">
                For large institutions or specific requirements, we offer
                enterprise solutions with custom pricing and features.
              </p>
              <div className="enterprise-buttons">
                <a href="#contact" className="btn btn-secondary btn-large">
                  Contact Us
                </a>
              </div>
            </div>
          </div>

          <div className="footer-newsletter">
            <div className="newsletter-content">
              <h4 className="newsletter-title">Stay Updated</h4>
              <p className="newsletter-description">
                By subscribing, you agree to our Privacy Policy and consent to
                receive updates from us.
              </p>
              <form className="newsletter-form">
                <div className="email-form-group">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="newsletter-input"
                    required
                  />
                  <button type="submit" className="newsletter-btn">
                    <span>Subscribe</span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 12H19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 5L19 12L12 19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
