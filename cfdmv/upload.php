<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Sample upload page</title>
  </head>
  <body>
    <p>Post field Name: <?php echo $_POST['name'];?> Password: <?php echo $_POST['password'];?></p>
    <p>FIle content:<br /><?php echo file_get_contents($_FILES['file']['tmp_name']); ?></p>
  </body>
</html>
