-- Due to stack complications, must be lua code

term = {}

term.setCursorPos = function()
  return 0, 0
end

term.getSize = function()
  return 0, 0
end

term.getCursorPos = function()
  return 0, 0
end

term.current = function()
  return {}
end

term.write = function(data)
  njs.write(data)
end

term.isColour =function()
  return false;
end

term.scroll = function()
  return
end

term.isColor = term.isColour

term.setTextColor = function()
  return nil
end

term.setTextColour = term.setTextColor

term.setBackgroundColor = function()
  return nil
end

term.setBackgroundColour = term.setBackgroundColor

term.setCursorBlink = function()
  return nil
end


term.redirect = function()
  return term
end

term.native = function()
  return term
end

term.clear = function()

end
