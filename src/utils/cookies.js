

export function setAuthCookies(res, accessToken, refreshToken) {
    res.cookie("accessToken", accessToken)
    res.cookie("refreshToken", refreshToken)
}