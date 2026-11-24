/**
 * Single place for all server names and contracts:
 * enums, symbol names, error codes and interfaces/data types.
 */
// ---------------------------------------------------------------------------
// Symbols
// ---------------------------------------------------------------------------
export var SymbolId;
(function (SymbolId) {
    SymbolId[SymbolId["Wild"] = 0] = "Wild";
    SymbolId[SymbolId["H1"] = 1] = "H1";
    SymbolId[SymbolId["H2"] = 2] = "H2";
    SymbolId[SymbolId["M1"] = 3] = "M1";
    SymbolId[SymbolId["M2"] = 4] = "M2";
    SymbolId[SymbolId["M3"] = 5] = "M3";
    SymbolId[SymbolId["L1"] = 6] = "L1";
    SymbolId[SymbolId["L2"] = 7] = "L2";
    SymbolId[SymbolId["L3"] = 8] = "L3";
    SymbolId[SymbolId["L4"] = 9] = "L4";
    SymbolId[SymbolId["L5"] = 10] = "L5";
    SymbolId[SymbolId["L6"] = 11] = "L6";
    SymbolId[SymbolId["Scatter"] = 12] = "Scatter";
})(SymbolId || (SymbolId = {}));
export var SymbolTier;
(function (SymbolTier) {
    SymbolTier[SymbolTier["Low"] = 0] = "Low";
    SymbolTier[SymbolTier["Medium"] = 1] = "Medium";
    SymbolTier[SymbolTier["High"] = 2] = "High";
})(SymbolTier || (SymbolTier = {}));
/** Short symbol codes (as used in the math / PDF). */
export const SYMBOL_CODES = {
    [SymbolId.Wild]: 'WW',
    [SymbolId.H1]: 'H1',
    [SymbolId.H2]: 'H2',
    [SymbolId.M1]: 'M1',
    [SymbolId.M2]: 'M2',
    [SymbolId.M3]: 'M3',
    [SymbolId.L1]: 'L1',
    [SymbolId.L2]: 'L2',
    [SymbolId.L3]: 'L3',
    [SymbolId.L4]: 'L4',
    [SymbolId.L5]: 'L5',
    [SymbolId.L6]: 'L6',
    [SymbolId.Scatter]: 'SC',
};
/** Human-readable symbol names (high-tech theme). */
export const SYMBOL_NAMES = {
    [SymbolId.Wild]: 'Quantum AI Core',
    [SymbolId.H1]: 'Hyper Rocket',
    [SymbolId.H2]: 'Plasma Blaster',
    [SymbolId.M1]: 'Cyber Jetpack',
    [SymbolId.M2]: 'Energy Battery',
    [SymbolId.M3]: 'AI Microchip',
    [SymbolId.L1]: 'Glyph A',
    [SymbolId.L2]: 'Glyph K',
    [SymbolId.L3]: 'Glyph Q',
    [SymbolId.L4]: 'Glyph J',
    [SymbolId.L5]: 'Glyph 10',
    [SymbolId.L6]: 'Glyph 9',
    [SymbolId.Scatter]: 'Singularity Portal',
};
export const SYMBOL_TIER_NAMES = {
    [SymbolTier.Low]: 'low',
    [SymbolTier.Medium]: 'medium',
    [SymbolTier.High]: 'high',
};
// ---------------------------------------------------------------------------
// API errors
// ---------------------------------------------------------------------------
export var ErrorCode;
(function (ErrorCode) {
    ErrorCode["RateLimited"] = "RATE_LIMITED";
    ErrorCode["InvalidSpinRequest"] = "INVALID_SPIN_REQUEST";
    ErrorCode["NotFound"] = "NOT_FOUND";
    ErrorCode["OriginNotAllowed"] = "ORIGIN_NOT_ALLOWED";
    ErrorCode["InvalidJson"] = "INVALID_JSON";
    ErrorCode["BodyTooLarge"] = "BODY_TOO_LARGE";
    ErrorCode["InternalError"] = "INTERNAL_ERROR";
})(ErrorCode || (ErrorCode = {}));
export var CheatMode;
(function (CheatMode) {
    CheatMode["H1Win"] = "h1_win";
    CheatMode["H2Win"] = "h2_win";
    CheatMode["WildWin"] = "wild_win";
    CheatMode["Scatter3"] = "scatter_3";
    CheatMode["Scatter4"] = "scatter_4";
    CheatMode["Scatter5"] = "scatter_5";
})(CheatMode || (CheatMode = {}));
//# sourceMappingURL=interface.js.map