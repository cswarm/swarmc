print("swarmc v1.0.0")
print("Node "..tostring(njs.host_node_version()))
print("OpenSSL v"..tostring(njs.host_openssl_version()))
print("using ".._VERSION)
print("Build Version: "..tostring(njs.host_emu_version()))
print("Build Date: "..tostring(njs.host_built()))
print("Built On: "..tostring(njs.host_built_with()))

local CRFOS = coroutine.create(function()
  print("\nlaunching crfos fork")
  local h = fs.open('/crfos.lua', 'r') -- handle
  local c = h.readAll() -- contents
  local f = load(c) -- function

  f() -- execute function

  -- main loop event
  while true do
    coroutine.yeild('main');
  end

  print('os thread died')
end)

coroutine.resume(CRFOS)

while coroutine.status(CRFOS) ~= "dead" do
  coroutine.resume(CRFOS)
end
