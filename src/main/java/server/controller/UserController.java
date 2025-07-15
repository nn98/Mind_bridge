package server.controller;



import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import server.beans.UserBean;
import server.service.UserService;

@RestController
@RequestMapping("/api/auth") 
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {
    
  @Autowired
  private UserService userService;

  public ResponseEntity<String> signup(@RequestBody UserBean userBean){
      userService.registerUser(userBean);
      return ResponseEntity.status(HttpStatus.CREATED).body("성공");
  }

  //유효성 검사 적용
  
  
  //유효성 결과+로그인 성공유무 
}
