#!/usr/bin/env ruby
app = ARGV[0]

# deploying these apps requires git subtree

# the git remote for the deploy of each app is the same as its folder name
# thats why #{app} is in here twice

# also note this doesn't work for the initial deploy because there is no remote master
# branch yet

`git push #{app} \`git subtree split --prefix #{app} master\`:master --force`
