const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
      try {
        /*
        |--------------------------------------------------------------------------
        | Check User Role
        |--------------------------------------------------------------------------
        */
  
        if (!allowedRoles.includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            message: "Access forbidden: insufficient permissions",
          });
        }
  
        next();
      } catch (error) {
        console.log(error);
  
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
        });
      }
    };
  };
  
  export default roleMiddleware;