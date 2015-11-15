#!/bin/bash

echo "--------------------Pre Commit script--------------------"
sleep 1


echo
echo "--------------------Running UnitTest --------------------"
sleep .5
cd src/
npm test > unitTestResults.txt
cat unitTestResults.txt
fail="$(grep -o "failing" unitTestResults.txt)"
# echo $fail
if [[ "$fail" == *"failing"* ]]; then
        echo "UnitTest fails, commit reject!"
    rm unitTestResults.txt
        exit 1
else
    rm unitTestResults.txt
        echo "All unit test cases passed!"
fi


echo "---------Running JSHint to analyse source code ----------"
sleep 1.5
cd -
git status > stage.txt
python get_staged_file.py > staged_file.txt

while read line
do
    jshint --config jshint.conf $line >> jshintResults.txt
done < staged_js.txt

jshintResults=jshintResults.txt

if [ -e "$jshintResults" ]; then
    cat jshintResults.txt
    errors="$(grep -o "errors" jshintResults.txt)"
    # echo $errors
    warnings="$(grep -o "warnings" jshintResults.txt)"

    if [[ "$errors" == *"errors"* ]]; then
        echo "JsHint errors in source file!"
        rm jshintResults.txt
        exec < /dev/tty
        while true; do
            read -p "Do you wish to continue this Commit? [Y/n]" yn
            if [ "$yn" = "" ]; then
                yn='Y'
            fi
            case $yn in
                [Yy]* ) break;;
                [Nn]* ) echo "Commit discard!";exit 1;;
            * ) echo "Please answer yes or no.";;
            esac
        done
        # exit 1
    elif [[ "$warnings" == "warnings" ]]; then
        echo "JsHint warnings in source file!"
        rm jshintResults.txt
        # exit 1
    else
        rm jshintResults.txt
        echo
    fi
else
    echo "No js file to be committed"
fi

echo
echo "-------------Running Comments Ratio Checking---------------"
sleep 1.5
# git status > stage.txt
python comments_ratio.py
rm staged_js.txt

echo
exec < /dev/tty

while true; do
     read -p "Do you wish to perform this Commit? [Y/n]" yn
     if [ "$yn" = "" ]; then
         yn='Y'
     fi
     case $yn in
         [Yy]* ) break;;
         [Nn]* ) echo "Commit discard!";exit 1;;
     * ) echo "Please answer yes or no.";;
     esac
 done
