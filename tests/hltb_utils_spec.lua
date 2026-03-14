--[[
    HLTB Utils Unit Tests

    Tests for string manipulation utilities in hltb_utils.lua.

    Run with: busted tests/
]]

package.path = package.path .. ";backend/?.lua"
local utils = require("hltb_utils")

describe("sanitize_game_name", function()
    it("removes trademark symbol", function()
        assert.equals("Game Name", utils.sanitize_game_name("Game Name™"))
    end)

    it("removes registered symbol", function()
        assert.equals("Game Name", utils.sanitize_game_name("Game Name®"))
    end)

    it("removes copyright symbol", function()
        assert.equals("Game Name", utils.sanitize_game_name("Game Name©"))
    end)

    it("normalizes curly apostrophes to straight", function()
        assert.equals("Tom Clancy's The Division 2", utils.sanitize_game_name("Tom Clancy\xe2\x80\x99s The Division 2"))
        assert.equals("Tom Clancy's The Division", utils.sanitize_game_name("Tom Clancy\xe2\x80\x98s The Division"))
    end)

    it("normalizes whitespace", function()
        assert.equals("Game Name", utils.sanitize_game_name("Game  Name"))
    end)

    it("trims whitespace", function()
        assert.equals("Game Name", utils.sanitize_game_name("  Game Name  "))
    end)
end)

describe("simplify_game_name", function()
    it("normalizes en-dash to hyphen", function()
        local result = utils.simplify_game_name("Game – Edition")
        assert.equals("Game - Edition", result)
    end)

    it("normalizes em-dash to hyphen", function()
        local result = utils.simplify_game_name("Game — Edition")
        assert.equals("Game - Edition", result)
    end)

    it("removes trailing punctuation", function()
        assert.equals("Game Name", utils.simplify_game_name("Game Name -"))
        assert.equals("Game Name", utils.simplify_game_name("Game Name:"))
    end)

    it("handles stacked suffixes", function()
        local result = utils.simplify_game_name("Game: Enhanced Edition Director's Cut")
        assert.equals("Game", result)
    end)
end)

describe("levenshtein_distance", function()
    it("returns 0 for identical strings", function()
        assert.equals(0, utils.levenshtein_distance("hello", "hello"))
    end)

    it("returns length for empty string comparison", function()
        assert.equals(5, utils.levenshtein_distance("hello", ""))
        assert.equals(5, utils.levenshtein_distance("", "hello"))
    end)

    it("calculates single character difference", function()
        assert.equals(1, utils.levenshtein_distance("hello", "hallo"))
    end)

    it("calculates insertion distance", function()
        assert.equals(1, utils.levenshtein_distance("hello", "helloo"))
    end)

    it("calculates deletion distance", function()
        assert.equals(1, utils.levenshtein_distance("hello", "hell"))
    end)
end)

describe("calculate_similarity", function()
    it("returns 1.0 for identical strings", function()
        assert.equals(1.0, utils.calculate_similarity("Dark Souls", "Dark Souls"))
    end)

    it("returns 1.0 for case-insensitive match", function()
        assert.equals(1.0, utils.calculate_similarity("DARK SOULS", "dark souls"))
    end)

    it("returns 0 for empty strings", function()
        assert.equals(0, utils.calculate_similarity("", "hello"))
        assert.equals(0, utils.calculate_similarity("hello", ""))
    end)

    it("returns high similarity for similar strings", function()
        local sim = utils.calculate_similarity("Dark Souls", "Dark Souls III")
        assert.is_true(sim > 0.5 and sim < 1.0)
    end)

    it("returns low similarity for different strings", function()
        local sim = utils.calculate_similarity("Dark Souls", "Hollow Knight")
        assert.is_true(sim < 0.5)
    end)
end)

describe("seconds_to_hours", function()
    it("returns nil for zero seconds", function()
        assert.is_nil(utils.seconds_to_hours(0))
    end)

    it("returns nil for nil input", function()
        assert.is_nil(utils.seconds_to_hours(nil))
    end)

    it("returns nil for negative seconds", function()
        assert.is_nil(utils.seconds_to_hours(-100))
    end)

    it("converts 3600 seconds to 1.0 hour", function()
        assert.equals(1.0, utils.seconds_to_hours(3600))
    end)

    it("converts 5400 seconds to 1.5 hours", function()
        assert.equals(1.5, utils.seconds_to_hours(5400))
    end)

    it("rounds to one decimal place", function()
        assert.equals(2.8, utils.seconds_to_hours(10000))
    end)
end)
