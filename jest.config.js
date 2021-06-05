module.exports = {
    preset: "ts-jest",
    globals: {
        "ts-jest": {
            diagnostics: {
                ignoreCodes: [
                    151001
                ]
            }
        }
    },
    verbose: true,
    collectCoverageFrom: [
        "src/**",
        "!src/types/**"
    ],
    coverageReporters: [
        "html",
        "text"
    ]
}
