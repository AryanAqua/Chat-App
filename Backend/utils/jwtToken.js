export const generateToken = (user, message, statusCode, res) => {
  const token = user.generateJsonWebToken();
  
  const cookieExpire = parseInt(process.env.COOKIE_EXPIRE) * 24 * 60 * 60 * 1000;

  res
    .status(statusCode)
    .cookie("token", token, {
      expires: new Date(Date.now() + cookieExpire),
      httpOnly: true,
    })
    .json({
      success: true,
      message,
      user,
      token,
    });
}