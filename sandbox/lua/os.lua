os.shutdown = function()
  js_shutdown()
end

os.reboot = function()
  js_shutdown()
end

os.getComputerID = function()
  return 0
end

os.startTimer = function(time)
  local osTimer = coroutine.create(function(time)
    local init = os.time()
    local diff=os.difftime(os.time(), init)
    while diff<time do
        coroutine.yield()
        diff=os.difftime(os.time(), init)
    end
  end)

  coroutine.resume(osTimer, time)

  while coroutine.status(osTimer) ~= "dead" do
    coroutine.resume(osTimer)
  end
end
