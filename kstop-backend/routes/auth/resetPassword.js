async function resetPassword(req, res) {
  return res.status(200).json({
    success: true,
    message: "Reset password endpoint — temporary implementation",
  });
}

module.exports = { resetPassword };