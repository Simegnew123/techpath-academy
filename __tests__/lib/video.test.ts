/**
 * video.test.ts — Tests for video embed URL parsing
 * Ensures YouTube and Vimeo URLs are correctly parsed
 */
import { getYouTubeEmbed, getVimeoEmbed, getVideoEmbed } from "@/lib/video";

describe("Video — getYouTubeEmbed", () => {
  it("should parse standard watch URL", () => {
    expect(getYouTubeEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))
      .toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });

  it("should parse short youtu.be URL", () => {
    expect(getYouTubeEmbed("https://youtu.be/dQw4w9WgXcQ"))
      .toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });

  it("should parse embed URL", () => {
    expect(getYouTubeEmbed("https://www.youtube.com/embed/dQw4w9WgXcQ"))
      .toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });

  it("should parse bare video ID", () => {
    expect(getYouTubeEmbed("dQw4w9WgXcQ"))
      .toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });

  it("should return null for empty string", () => {
    expect(getYouTubeEmbed("")).toBeNull();
  });

  it("should return null for non-YouTube URL", () => {
    expect(getYouTubeEmbed("https://vimeo.com/12345")).toBeNull();
  });

  it("should handle URLs with extra params", () => {
    expect(getYouTubeEmbed("https://www.youtube.com/watch?v=abc123XYZ&t=10s"))
      .toBe("https://www.youtube-nocookie.com/embed/abc123XYZ");
  });
});

describe("Video — getVimeoEmbed", () => {
  it("should parse vimeo URL", () => {
    expect(getVimeoEmbed("https://vimeo.com/123456789"))
      .toBe("https://player.vimeo.com/video/123456789");
  });

  it("should return null for non-vimeo URL", () => {
    expect(getVimeoEmbed("https://youtube.com/watch?v=abc")).toBeNull();
  });
});

describe("Video — getVideoEmbed", () => {
  it("should detect YouTube URLs", () => {
    expect(getVideoEmbed("https://youtu.be/abc123XYZ"))
      .toBe("https://www.youtube-nocookie.com/embed/abc123XYZ");
  });

  it("should detect Vimeo URLs", () => {
    expect(getVideoEmbed("https://vimeo.com/123456789"))
      .toBe("https://player.vimeo.com/video/123456789");
  });

  it("should return null for unknown URL", () => {
    expect(getVideoEmbed("https://example.com/video")).toBeNull();
  });
});
