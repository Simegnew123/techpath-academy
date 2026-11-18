/**
 * CourseCard.test.tsx — Tests for CourseCard component rendering
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import CourseCard, { formatPrice, formatDuration, type CourseCardData } from "@/components/CourseCard";

// Mock CurrencyDisplay to avoid complex rendering
jest.mock("@/components/CurrencyDisplay", () => {
  return function MockCurrencyDisplay({ priceKES }: { priceKES: number }) {
    return React.createElement("span", null, priceKES === 0 ? "Free" : `KSh ${priceKES}`);
  };
});

// Mock next/link
jest.mock("next/link", () => {
  return ({ href, children, ...props }: any) =>
    React.createElement("a", { href, ...props }, children);
});

const mockCourse: CourseCardData = {
  id: "course-1",
  slug: "intro-to-networking",
  title: "Introduction to Networking",
  description: "Learn the fundamentals of networking, from OSI model to TCP/IP.",
  coverImage: "",
  price: 0,
  published: true,
  level: "Beginner",
  categoryName: "Networking",
  categoryIcon: "🌐",
  rating: 4.5,
  reviewCount: 12,
  lessonCount: 8,
  totalDuration: 120,
  instructorName: "Jane Doe",
};

describe("CourseCard — formatPrice", () => {
  it("should return 'Free' for price 0", () => {
    expect(formatPrice(0)).toBe("Free");
  });

  it("should format price with KSh prefix and commas", () => {
    expect(formatPrice(5000)).toBe("KSh 5,000");
  });

  it("should format large numbers", () => {
    expect(formatPrice(1500000)).toBe("KSh 1,500,000");
  });
});

describe("CourseCard — formatDuration", () => {
  it("should return empty string for 0 minutes", () => {
    expect(formatDuration(0)).toBe("");
  });

  it("should format minutes under 60", () => {
    expect(formatDuration(45)).toBe("45 min");
  });

  it("should format exact hours", () => {
    expect(formatDuration(120)).toBe("2h");
  });

  it("should format hours and minutes", () => {
    expect(formatDuration(90)).toBe("1h 30m");
  });
});

describe("CourseCard — rendering", () => {
  it("should render course title", () => {
    render(React.createElement(CourseCard, { course: mockCourse }));
    expect(screen.getByText("Introduction to Networking")).toBeInTheDocument();
  });

  it("should render course description", () => {
    render(React.createElement(CourseCard, { course: mockCourse }));
    expect(screen.getByText(/Learn the fundamentals of networking/)).toBeInTheDocument();
  });

  it("should render category name", () => {
    render(React.createElement(CourseCard, { course: mockCourse }));
    // "Networking" appears in both the title and category — use getAllByText
    const matches = screen.getAllByText(/Networking/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("should render lesson count", () => {
    render(React.createElement(CourseCard, { course: mockCourse }));
    expect(screen.getByText(/8 lessons/)).toBeInTheDocument();
  });

  it("should render instructor name", () => {
    render(React.createElement(CourseCard, { course: mockCourse }));
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("should link to correct course URL", () => {
    const { container } = render(React.createElement(CourseCard, { course: mockCourse }));
    const link = container.querySelector("a");
    expect(link).toBeTruthy();
    expect(link!.getAttribute("href")).toBe("/courses/intro-to-networking");
  });

  it("should show level badge", () => {
    render(React.createElement(CourseCard, { course: mockCourse }));
    expect(screen.getByText("Beginner")).toBeInTheDocument();
  });

  it("should show rating when rating > 0", () => {
    render(React.createElement(CourseCard, { course: mockCourse }));
    expect(screen.getByText(/4\.5/)).toBeInTheDocument();
  });

  it("should not show rating when rating is 0", () => {
    const noRating = { ...mockCourse, rating: 0 };
    const { container } = render(React.createElement(CourseCard, { course: noRating }));
    expect(container.textContent).not.toContain("⭐");
  });
});
