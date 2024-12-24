import express from "express";
import { v2 as cloudinary } from "cloudinary";
import { generateToken } from "../utils/jwtToken.js";
import User from "../models/user.model.js";

export const register = async (req, res) => {
  //checking if any files exists on HTTPS
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ message: "All fields are required" });
  }

  //Handling Cloudinary Things first
  const { profilePic } = req.files;

  //Uploading on Cloudinary
  const cloudinaryResponseForProfliePic = await cloudinary.uploader.upload(
    profilePic.tempFilePath,
    { folder: "Chat-APP ProfilePic" }
  );

  if (
    !cloudinaryResponseForProfliePic ||
    cloudinaryResponseForProfliePic.error
  ) {
    console.error(
      "Cloudinary Error:",
      cloudinaryResponseForAvatar.error || "Some cloudinary error"
    );
    return res
      .status(500)
      .json({ message: "Cloudinary upload of Profile Pic failed" });
  }

  const { userName, email, password } = req.body;

  try {
    if (!userName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const newUser = new User({
      userName,
      email,
      password,
      profilePic: {
        public_id: cloudinaryResponseForProfliePic.public_id,
        url: cloudinaryResponseForProfliePic.secure_url,
      },
    });

    if (newUser) {
      // generate jwt token here
      await newUser.save();
      generateToken(newUser, "Registered!", 201, res);
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in register controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");
    console.log("User from login: ", user)

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user, "Login Successfully!", 200, res);
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = async (req, res) => {
  res
    .status(200)
    .cookie("token", "", {
      httpsOnly: true,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Logged Out Successfully",
    });
};

export const updateProfile = async (req, res) => {
  const newUserData = {
    userName: req.body.userName,
  };

  const userId = req.user._id;

  try {
    //Changing ProfilePic first
    if (req.files && req.files.profilePic) {
      const profilePic = req.files.profilePic;
      const user = await User.findById(userId);
      const profilePicId = user.profilePic.public_id;
      await cloudinary.uploader.destroy(profilePicId);
      const newProfilePIc = await cloudinary.uploader.upload(
        profilePic.tempFilePath,
        {
          folder: "Chat-APP ProfilePic",
        }
      );

      newUserData.profilePic = {
        public_id: newProfilePIc.public_id,
        url: newProfilePIc.secure_url,
      };
    }

    const user = await User.findByIdAndUpdate(userId, newUserData, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
    
    res.status(200).json({
      success: true,
      message: "Profile Updated!",
      user,
    })
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updatePassword = async (req, res) => {
  const {currentPassword, newPassword, confirmNewPassword} = req.body;
  const user = await User.findById(req.user._id).select("+password");
  try {
    if(!currentPassword || !newPassword || confirmNewPassword) {
      return res.status(400).json({message: "Please Fill all the fields!!"});
    }

    const isMatchedPassword = await user.comparePassword(currentPassword);
    if(!isMatchedPassword){
      return res.status(400).json({message: "Please Enter Correct Password"});
    }

    if(newPassword !== confirmNewPassword){
      return res.status(400).json({message: "New Password and Current Password Do not match"});
    };

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password Updated!"
    })
  } catch (error) {
    console.log("error in update password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
